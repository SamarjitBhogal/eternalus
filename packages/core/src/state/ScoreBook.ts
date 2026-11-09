import type { PlayableTeam } from '../teams/teams.types';
import { createEmptyScoringState } from './emptyScoringState';
import type { EntityId } from './EntityStore.types';
import type {
  Award,
  LegendCounter,
  LegendIdentity,
  MutableLegendStats,
  MutableScoringState,
  TeamCounter,
} from './ScoreBook.types';
import type { LegendStats, ScoringState } from './ScoringState.types';

/**
 * The match's scoring data (architecture 12 §5) and its only writer (DEC-211): plain data, so
 * `StateHasher` hashes it and a replay rebuilds it. `MatchRecord` holds it, and everyone else
 * reads it through `MatchState.scoring`, a read-only view of the same data. Its writers keep the
 * rule "a team's score is the sum of its Legends' points plus its team-only points" in one place.
 * Each writer has one caller: `Scoring`, in its fold. What counts is `Scoring`'s business; the
 * book only records it.
 */
export class ScoreBook {
  private readonly data: MutableScoringState = createEmptyScoringState();

  /** The scoring data, read-only at every depth: `MatchState.scoring`. */
  public get view(): ScoringState {
    return this.data;
  }

  /** The Legend's row, or `undefined` when it has none. */
  public rowOf(legendId: EntityId): LegendStats | undefined {
    return this.findRow(legendId);
  }

  /**
   * Adds a row with every counter at 0, after the others (spawn order). Keeps one row per Legend:
   * an id that already has a row keeps it, counters and all.
   */
  public addRow(identity: LegendIdentity): void {
    if (this.findRow(identity.entityId) !== undefined) {
      return;
    }
    this.data.legends.push({
      ...identity,
      kills: 0,
      deaths: 0,
      assists: 0,
      minionKills: 0,
      neutralKills: 0,
      structureDamage: 0,
      score: 0,
    });
  }

  /**
   * Raises the Legend's counter and adds the points to its score and to its team's total. An id
   * with no row is a bug (`Scoring` checks `rowOf` first) and throws.
   */
  public award(legendId: EntityId, { counter, by, points }: Award<LegendCounter>): void {
    const row = this.findRow(legendId);
    if (row === undefined) {
      throw new Error(`No scoring row for "${legendId}": award only a Legend with a row.`);
    }
    row[counter] += by;
    row.score += points;
    this.data.teams[row.team].score += points;
  }

  /** Raises the team's counter and adds team-only points (no Legend's) to its total. */
  public awardTeam(team: PlayableTeam, { counter, by, points }: Award<TeamCounter>): void {
    const totals = this.data.teams[team];
    totals[counter] += by;
    totals.score += points;
  }

  /** Records that `legendId` hit `victimId` on `tick`: one entry per pair, at its latest tick (DEC-132). */
  public recordHit(victimId: EntityId, legendId: EntityId, tick: number): void {
    const known = this.data.recentHits.find(
      (hit) => hit.victimId === victimId && hit.legendId === legendId,
    );
    if (known === undefined) {
      this.data.recentHits.push({ victimId, legendId, tick });
    } else {
      known.tick = tick;
    }
  }

  /**
   * The Legends whose last hit on `victimId` is at most `windowTicks` before `tick`, in the order
   * they first hit it, and forgets every hit on `victimId`: called once, at its death.
   */
  public takeAssists(victimId: EntityId, tick: number, windowTicks: number): EntityId[] {
    const helpers = this.data.recentHits
      .filter((hit) => hit.victimId === victimId && tick - hit.tick <= windowTicks)
      .map((hit) => hit.legendId);
    this.data.recentHits = this.data.recentHits.filter((hit) => hit.victimId !== victimId);
    return helpers;
  }

  private findRow(legendId: EntityId): MutableLegendStats | undefined {
    return this.data.legends.find((row) => row.entityId === legendId);
  }
}
