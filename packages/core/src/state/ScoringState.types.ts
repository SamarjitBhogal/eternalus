import type { PlayableTeam } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';

/**
 * One Legend's line on the results screen (architecture 12 §5, DEC-79): who it is, its counters
 * and its points. The row stays after the Legend dies or leaves the store. The other 12 §5
 * counters join with the work that fills them (DEC-122).
 */
export type LegendStats = {
  readonly entityId: EntityId;
  readonly team: PlayableTeam;
  /** The Legend class's content id (`warrior`, `sentinel`, `magus`). */
  readonly classId: string;
  /** `human` for the Legend in `state.match.humanLegendId`, else `bot`. */
  readonly controller: 'human' | 'bot';
  /** Enemy Legends it landed the last hit on. */
  kills: number;
  deaths: number;
  /**
   * Enemy Legends it hit inside the assist window before another unit or the world landed the
   * last hit.
   */
  assists: number;
  /** Enemy Host units (light or dark mobs) it landed the last hit on. */
  minionKills: number;
  /** Neutral mobs it landed the last hit on. */
  neutralKills: number;
  /** Damage it dealt to enemy structures, shield bars included (DEC-123). */
  structureDamage: number;
  score: number;
};

/** One team's line on the results screen: the sum of its Legends' scores (12 §5). */
export type TeamStats = {
  score: number;
};

/** The last tick a Legend hit an enemy Legend: one entry per pair, so the list stays bounded. */
type RecentHit = {
  readonly victimId: EntityId;
  readonly legendId: EntityId;
  tick: number;
};

/**
 * What `Scoring` has counted so far (architecture 12 §5), all plain data in `state.match`, so it
 * is hashed and replayed. Written only by `Scoring.fold`.
 */
export type ScoringState = {
  /** One row per Legend, in spawn order. */
  readonly legends: LegendStats[];
  readonly teams: Record<PlayableTeam, TeamStats>;
  /** The hits that can still earn an assist; an entry goes when its victim dies. */
  recentHits: RecentHit[];
};
