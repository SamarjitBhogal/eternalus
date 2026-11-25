import { Transform } from '../components/Transform';
import type { XpSourcesDefinition } from '../content/progression/progression.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameEventMap } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import type { Award } from './ProgressionSystem.types';

type Hit = { readonly defenceId: string; readonly legendId: EntityId; readonly amount: number };

/**
 * `ProgressionSystem`'s checkpoint XP (07 §7, balancing.md "Capture points"). It buffers each hit
 * a Legend lands on a checkpoint defender and each `checkpoint-cleared`; on `flush` (the system's
 * pass, 03 §4) it adds the hits to `state.defenderDamage`, then turns each cleared set into one
 * award per clearing-team Legend alive within `shareRadius` of where the last defender fell:
 * `xp × (evenShare / n + (1 − evenShare) × damage_i / totalDamage)`, where the damage is what each
 * of those Legends dealt to the set, or `xp / n` when they dealt none. A clear with no known killer,
 * no position, or no XP for its checkpoint pays nobody. Two sets of one capture point cleared
 * together pay each Legend one summed award, as the invariant allows one award per point a tick.
 */
export class CheckpointAwards {
  private readonly hits: Hit[] = [];
  private readonly cleared: GameEventMap['checkpoint-cleared'][] = [];

  /**
   * @param state - The match whose hits and clears this listens to.
   * @param rule - The checkpoint XP and its share (content).
   */
  public constructor(
    state: GameState,
    private readonly rule: XpSourcesDefinition['checkpointCleared'],
  ) {
    state.events.on('damage-applied', ({ targetId, amount, source }) => {
      const defenceId = state.guards.slotOf(targetId)?.defenceId;
      const legendId = source.attackerId;
      if (
        defenceId !== undefined &&
        legendId !== null &&
        state.entities.get(legendId)?.family === 'legend'
      ) {
        this.hits.push({ defenceId, legendId, amount });
      }
    });
    state.events.on('checkpoint-cleared', (payload) => {
      this.cleared.push(payload);
    });
  }

  /** Records this tick's hits, then returns the awards of the sets cleared since the last pass. */
  public flush(state: GameState): Award[] {
    for (const { defenceId, legendId, amount } of this.hits.splice(0)) {
      state.defenderDamage.add(defenceId, legendId, amount);
    }
    const awards = new Map<string, Award & { readonly kind: 'checkpoint-cleared' }>();
    for (const clear of this.cleared.splice(0)) {
      const damage = state.defenderDamage.take(clear.defenceId);
      for (const award of this.sharesOf(state, clear, damage)) {
        const key = `${award.killerId}\u0000${award.victimId}`;
        const earlier = awards.get(key);
        awards.set(key, earlier === undefined ? award : { ...award, xp: earlier.xp + award.xp });
      }
    }
    return [...awards.values()];
  }

  private sharesOf(
    state: GameState,
    { pointId, checkpoint, defendersTeam, team, position }: GameEventMap['checkpoint-cleared'],
    damage: ReadonlyMap<EntityId, number>,
  ): (Award & { readonly kind: 'checkpoint-cleared' })[] {
    const xp = this.rule.xp[checkpoint];
    if (xp === undefined || team === null || position === null) {
      return [];
    }
    const recipients: EntityId[] = [];
    state.entities.forEach((entity) => {
      const at = entity.findComponent(Transform)?.position;
      if (
        entity.family === 'legend' &&
        state.entities.teamOf(entity.id) === team &&
        state.entities.isAlive(entity.id) &&
        at !== undefined &&
        Math.hypot(at.x - position.x, at.y - position.y) <= this.rule.shareRadius
      ) {
        recipients.push(entity.id);
      }
    });
    const total = recipients.reduce((sum, id) => sum + (damage.get(id) ?? 0), 0);
    const { evenShare } = this.rule;
    return recipients.map((id) => ({
      kind: 'checkpoint-cleared',
      killerId: id,
      victimId: pointId,
      victimTeam: defendersTeam,
      xp:
        total === 0
          ? xp / recipients.length
          : xp *
            (evenShare / recipients.length + ((1 - evenShare) * (damage.get(id) ?? 0)) / total),
    }));
  }
}
