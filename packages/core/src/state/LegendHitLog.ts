import type { Team } from '../teams/teams.types';
import type { EntityStore } from './EntityStore';
import type { EntityId } from './EntityStore.types';
import type { GameEvents } from './GameEvents';

/**
 * The tick each Legend last hit a Legend of each team, for the AI (architecture 11 §4.5): a wall
 * turret prefers "a Legend that damaged an allied Legend in the last 3 s" (balancing.md "Turrets —
 * MVP"). Fed by `damage-applied`: a hit counts when its attacker and its target are Legends,
 * whatever its amount. A reader asks about one team, so a hit on the attacker's own team never
 * marks it as an enemy's hurter.
 * Unlike the assist record (`ScoringState.recentHits`), which forgets the hits on a Legend at its
 * death, it keeps them, so a turret still sees the Legend that killed its ally. One tick per
 * attacker and team, so it never grows past the roster. It is fed by the events, as
 * `AllyDamageStore` is, and `StateHasher` hashes it as it does that store (`size`, `forEach`).
 */
export class LegendHitLog {
  private readonly lastHitTicks = new Map<EntityId, Map<Team, number>>();

  /**
   * Subscribes to `events`; lives as long as the match.
   *
   * @param events - The channel `damage-applied` arrives on.
   * @param entities - Where attackers and targets are looked up.
   * @param clock - The current tick.
   */
  public constructor(
    events: GameEvents,
    private readonly entities: EntityStore,
    private readonly clock: () => number,
  ) {
    events.on('damage-applied', ({ targetId, source }) => {
      this.record(source.attackerId, targetId);
    });
  }

  /** How many attackers have hit a Legend. */
  public get size(): number {
    return this.lastHitTicks.size;
  }

  /** Every recorded hit: attacker, team hit and tick, in the order each was first recorded. */
  public forEach(visit: (legendId: EntityId, team: Team, tick: number) => void): void {
    this.lastHitTicks.forEach((byTeam, legendId) => {
      byTeam.forEach((tick, team) => {
        visit(legendId, team, tick);
      });
    });
  }

  /** Whether `legendId` hit a Legend of `team` at `sinceTick` or later. */
  public hasHitTeamSince(legendId: EntityId, team: Team, sinceTick: number): boolean {
    const tick = this.lastHitTicks.get(legendId)?.get(team);
    return tick !== undefined && tick >= sinceTick;
  }

  private record(attackerId: EntityId | null, targetId: EntityId): void {
    if (attackerId === null) return;
    const team = this.entities.teamOf(targetId);
    const isLegendOnLegend =
      this.entities.get(targetId)?.family === 'legend' &&
      this.entities.get(attackerId)?.family === 'legend';
    if (!isLegendOnLegend || team === undefined) return;
    const byTeam = this.lastHitTicks.get(attackerId) ?? new Map<Team, number>();
    byTeam.set(team, this.clock());
    this.lastHitTicks.set(attackerId, byTeam);
  }
}
