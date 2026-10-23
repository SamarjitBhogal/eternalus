import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import { LEGEND_KINDS } from '../content/legends/legendKinds';
import type { LevelScalingDefinition } from '../content/progression/progression.types';
import { MOB_KINDS } from '../content/mobs/mobKinds';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';
import type { Award, ProgressionContent } from './ProgressionSystem.types';

/**
 * Turns kills into XP and levels (architecture 05 §13). It listens to `entity-died`, prices the kill
 * while the victim is still in the store, and in its own pass gives the XP to the killer's
 * `Progression`. Self-kills and ally kills pay nothing (O5). Each level gained raises max health by
 * the class's share of its base health (O3) and max aether, heals and refills by the raise only
 * while the Legend is alive (O4), and emits `level-up`.
 */
export class ProgressionSystem implements System {
  public readonly name = 'progression';

  private readonly pending: Award[] = [];

  /**
   * @param state - The match whose `entity-died` events this system listens to.
   * @param content - The unit definitions, level curves and XP sources it prices and levels with.
   */
  public constructor(
    state: GameState,
    private readonly content: ProgressionContent,
  ) {
    state.events.on('entity-died', ({ entityId, killer }) => {
      const victim = state.entities.get(entityId);
      const killerId = killer.attackerId;
      if (killerId === null || victim === undefined) {
        return;
      }
      const victimTeam = victim.findComponent(TeamMembership)?.team;
      const killerTeam = state.entities.get(killerId)?.findComponent(TeamMembership)?.team;
      if (victimTeam === undefined || killerTeam === victimTeam) {
        // O5: no reward for an ally kill or a self-kill (a killer is on its own team); teams are
        // compared, so neutral camp mobs still pay.
        return;
      }
      const xp = this.xpFor(victim);
      if (xp > 0) {
        this.pending.push({ killerId, victimId: entityId, victimTeam, xp });
      }
    });
  }

  /** Gives this tick's kill XP, in kill order, and applies each level gained. */
  public update({ state }: SystemContext): void {
    for (const award of this.pending.splice(0)) {
      const killer = state.entities.get(award.killerId);
      const progression = killer?.findComponent(Progression);
      // TODO(claudiodh): O4 pays a Legend killed earlier, but `DeathSystem` still removes dead
      // Legends, so its XP is dropped here; respawn (FR-051, SCRUM-178) must keep them in the store.
      if (killer === undefined || progression === undefined) {
        continue;
      }
      const gained = this.award(killer, progression, award, state);
      const definition = this.content.units.get(killer.definitionId);
      for (let step = gained - 1; step >= 0; step -= 1) {
        if (LEGEND_KINDS.has(definition)) {
          ProgressionSystem.levelUp(killer, definition.levelScaling, definition.baseHealth);
        }
        state.events.emit('level-up', { entityId: killer.id, level: progression.level - step });
      }
    }
  }

  /** The one caller of `addXp`; it always announces the award, so none can bypass the invariant. */
  private award(
    recipient: Entity,
    progression: Progression,
    award: Award,
    state: GameState,
  ): number {
    state.events.emit('xp-gained', {
      entityId: recipient.id,
      amount: award.xp,
      victimId: award.victimId,
      victimTeam: award.victimTeam,
    });
    return progression.addXp(award.xp, this.content.curves.get(progression.curveId));
  }

  private xpFor(victim: Entity): number {
    const level = victim.findComponent(Progression)?.level;
    if (level !== undefined) {
      const { base, perVictimLevel } = this.content.xpSources.legendKill;
      return base + perVictimLevel * level;
    }
    if (!this.content.units.has(victim.definitionId)) {
      return 0;
    }
    const definition = this.content.units.get(victim.definitionId);
    return MOB_KINDS.has(definition) ? definition.xpValue : 0;
  }

  /** One rule in one place (O3/O4): raise the caps; heal and refill by the raise only while alive. */
  private static levelUp(
    entity: Entity,
    scaling: LevelScalingDefinition,
    baseHealth: number,
  ): void {
    const health = entity.getComponent(Health);
    const aether = entity.getComponent(Aether);
    const healthRaise = baseHealth * scaling.healthPerLevel; // O3: +8% of level-1 base, additive
    health.raiseMax(healthRaise);
    aether.raiseMax(scaling.aetherPerLevel);
    if (!health.isDead) {
      health.heal(healthRaise);
      aether.restore(scaling.aetherPerLevel);
    }
  }
}
