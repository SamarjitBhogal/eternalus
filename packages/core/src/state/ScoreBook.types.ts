import type { PlayableTeam } from '../teams/teams.types';
import type { LegendStats, RecentHit, TeamStats } from './ScoringState.types';

/** A Legend row as the `ScoreBook` keeps it: the same fields, writable only inside the book. */
export type MutableLegendStats = { -readonly [Key in keyof LegendStats]: LegendStats[Key] };

/** A team's totals as the `ScoreBook` keeps them: the same fields, writable only inside the book. */
type MutableTeamStats = { -readonly [Key in keyof TeamStats]: TeamStats[Key] };

/** A recent hit as the `ScoreBook` keeps it: its tick moves to the latest hit of the pair. */
type MutableRecentHit = { -readonly [Key in keyof RecentHit]: RecentHit[Key] };

/** The scoring data as the `ScoreBook` keeps it; everyone else sees it as `ScoringState`. */
export type MutableScoringState = {
  readonly legends: MutableLegendStats[];
  readonly teams: Record<PlayableTeam, MutableTeamStats>;
  recentHits: MutableRecentHit[];
};

/** Who a new row is for: the fields a row keeps for life (its counters start at 0). */
export type LegendIdentity = Pick<LegendStats, 'entityId' | 'team' | 'classId' | 'controller'>;

/**
 * A Legend counter that `ScoreBook.award` raises: every `LegendStats` field but the row's identity
 * and its `score`, so a new counter is one field and its 0 in `ScoreBook.addRow`.
 */
export type LegendCounter = Exclude<keyof LegendStats, keyof LegendIdentity | 'score'>;

/**
 * A team counter that `ScoreBook.awardTeam` raises: every `TeamStats` field but its `score`, so a
 * new counter is one field and its 0 in `createEmptyScoringState`.
 */
export type TeamCounter = Exclude<keyof TeamStats, 'score'>;

/** One award: a counter goes up by `by`, and the points go to the score. */
export type Award<Counter extends string> = {
  readonly counter: Counter;
  /**
   * How much the counter goes up: 1 for a kill, death, assist or checkpoint; the damage for
   * `structureDamage`; the capture points owned for `capturesHeldTicks`.
   */
  readonly by: number;
  /** The points it is worth; 0 for a counter with no points. */
  readonly points: number;
};
