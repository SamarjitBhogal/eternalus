import { LastEnemyHit } from '../components/LastEnemyHit';
import type { EntityId } from '../state/EntityStore.types';
import type { DamageSource } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';

/**
 * Who a death by the Cathedral gem counts for (DEC-346): "last one to damage the dying legend as
 * long as the damage was dealt within N seconds", N being the assist window. `DamagePipeline` asks
 * it once per landed hit and once per death, so every reader of `entity-died` (scoring, XP,
 * veterancy, the invariants) sees the same killer. The credited killer keeps the gem's source kind
 * and id (the owner's "falling brick" icon) and gains the enemy as its attacker; whether that
 * enemy earns a Legend kill, points or XP is then each reader's own rule. With no enemy hit in the
 * window the killer stays empty: a death, and no one's kill or XP.
 */
export class KillCredit {
  private readonly credited: ReadonlySet<string>;

  /**
   * @param windowTicks - How long an enemy hit still earns the kill (the assist window).
   * @param creditedSourceIds - The definition ids of the attacker-less damage whose kills go to
   *   the victim's last enemy damager (`CATHEDRAL_GEM.statusIds`).
   */
  public constructor(
    private readonly windowTicks: number,
    creditedSourceIds: readonly string[],
  ) {
    this.credited = new Set(creditedSourceIds);
  }

  /** Remembers a landed hit's attacker on its target when the two are on different teams. */
  public recordHit(state: GameState, targetId: EntityId, { attackerId }: DamageSource): void {
    const target = state.entities.get(targetId);
    if (attackerId === null || attackerId === targetId || target === undefined) return;
    const attackerTeam = state.entities.teamOf(attackerId);
    if (attackerTeam === undefined || attackerTeam === state.entities.teamOf(targetId)) return;
    const last = target.findComponent(LastEnemyHit);
    if (last === undefined) target.addComponent(new LastEnemyHit(attackerId, state.tick));
    else last.record(attackerId, state.tick);
  }

  /** The killer `entity-died` names: `source`, or for a credited source the last enemy damager. */
  public killerOf(state: GameState, victimId: EntityId, source: DamageSource): DamageSource {
    if (source.attackerId !== null || !this.credited.has(source.definitionId)) return source;
    const attackerId =
      state.entities
        .get(victimId)
        ?.findComponent(LastEnemyHit)
        ?.attackerIdWithin(state.tick, this.windowTicks) ?? null;
    return attackerId === null ? source : { ...source, attackerId };
  }
}
