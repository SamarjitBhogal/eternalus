import type { PlayableTeam } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';

/**
 * One Legend's line on the results screen (architecture 12 §5, DEC-79): who it is, its counters
 * and its points. The row stays after the Legend dies or leaves the store. The other 12 §5
 * counters join with the work that fills them (DEC-122). Read-only: only the `ScoreBook` writes
 * it (DEC-211).
 */
export type LegendStats = {
  readonly entityId: EntityId;
  readonly team: PlayableTeam;
  /** The Legend class's content id (`warrior`, `sentinel`, `magus`). */
  readonly classId: string;
  /** `human` for the Legend in `state.match.humanLegendId`, else `bot`. */
  readonly controller: 'human' | 'bot';
  /** Enemy Legends it landed the last hit on. */
  readonly kills: number;
  readonly deaths: number;
  /**
   * Enemy Legends it hit inside the assist window before another unit or the world landed the
   * last hit.
   */
  readonly assists: number;
  /**
   * Enemy team mobs (Host units and tower guards, DEC-211 (2)) it landed the last hit on.
   */
  readonly minionKills: number;
  /** Neutral mobs it landed the last hit on. */
  readonly neutralKills: number;
  /** Damage it dealt to enemy structures, shield bars included (DEC-123). */
  readonly structureDamage: number;
  /**
   * Checkpoints its team's push reached on a capture point while it stood in the zone: a counter
   * only, with no points (DEC-214 (A1)).
   */
  readonly checkpointsWon: number;
  readonly score: number;
};

/**
 * One team's line on the results screen (12 §5): its `score` is the sum of its Legends' scores
 * plus its team-only points. Read-only: only the `ScoreBook` writes it (DEC-211).
 */
export type TeamStats = {
  readonly score: number;
  /** Enemy structures that fell, whoever landed the last hit (DEC-212). */
  readonly structuresDestroyed: number;
  /**
   * Ticks of capture points held, pooled over its points: each tick adds one per point it owns
   * (DEC-214 (A2)). A lost point stops adding but takes nothing back.
   */
  readonly capturesHeldTicks: number;
};

/** The last tick a Legend hit an enemy Legend: one entry per pair, so the list stays bounded. */
export type RecentHit = {
  readonly victimId: EntityId;
  readonly legendId: EntityId;
  readonly tick: number;
};

/**
 * What `Scoring` has counted so far (architecture 12 §5), all plain data in `state.match`, so it
 * is hashed and replayed. A read-only view at every depth (`MatchState.scoring`): the `ScoreBook`
 * that `MatchRecord` holds keeps the same data and is its only writer (DEC-211).
 */
export type ScoringState = {
  /** One row per Legend, in spawn order. */
  readonly legends: readonly LegendStats[];
  readonly teams: Readonly<Record<PlayableTeam, TeamStats>>;
  /** The hits that can still earn an assist; an entry goes when its victim dies. */
  readonly recentHits: readonly RecentHit[];
  /**
   * How many capture points each team owns now, kept from `capture-point-owner-changed`: each
   * tick adds this many ticks to the team's `capturesHeldTicks` (12 §5, DEC-214 (A2)).
   */
  readonly ownedPoints: Readonly<Record<PlayableTeam, number>>;
};
