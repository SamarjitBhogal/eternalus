import type { CollisionQuery } from './CollisionQuery.types';
import type { ScheduledMark } from './MatchState.types';
import type { PathQuery } from './PathQuery.types';
import type { PlacedWalls } from './PlacedWalls.types';
import type { SpaceQuery } from './SpaceQuery.types';

/**
 * A command the simulation applied, with the tick it was applied on. Typed structurally because
 * `state/` may not import `commands/` (architecture 03 §4); every `Command` fits it.
 */
export type RecordedCommand = {
  readonly tick: number;
  readonly command: { readonly type: string };
};

/**
 * One playable team's match counters (architecture 03 §2). `unitsRequested` counts every unit asked
 * for: each horde member (architecture 18 §3.4) and each guard refill attempt, whether it was
 * spawned or not. `unitsSuppressed` counts those the unit cap kept out: horde members and blocked
 * guard refills. A refill that succeeds is a request only (DEC-169); one the cap blocks counts
 * once, on the tick its post comes due (S56-F1). The counts are of attempts (DEC-219 (b)): a refill
 * blocked when due and filled later is two requests and one suppressed.
 */
export type TeamState = {
  readonly unitsRequested: number;
  readonly unitsSuppressed: number;
  /**
   * Lane towers this team has lost on each lane (by `MapLane.id`; 18 MS-16): its minions carry one
   * `enraged` stack per loss, and each loss moves the enemy's base-stat point toward it (DISC-24).
   */
  readonly towersLostByLane: Readonly<Record<string, number>>;
};

/** The match's timing, resolved from its config by `Simulation` (none in most unit tests). */
export type GameStateTiming = {
  /** The resolved timeline (`MatchTimeline`) as plain marks; empty when no director runs. */
  readonly schedule?: readonly ScheduledMark[];
  /**
   * The tick the pre-match countdown ends (`timelineFrameOf`); 0, no countdown, when not given.
   * Passed in because `state/` imports only types from `config/` (architecture 02 §3; DEC-286).
   */
  readonly countdownEndTick?: number;
};

/** The match's spatial indexes, built by `Simulation` (none in most unit tests). */
export type GameStateIndexes = {
  /** Every unit's position at the last rebuild, for neighbour queries (architecture 11 §3). */
  readonly space?: SpaceQuery | null;
  /** A\* for Legends over the map's grid (architecture 10 §9). */
  readonly paths?: PathQuery | null;
  /** The walls and edge that stop a dash as they stop walking (architecture 10 §7). */
  readonly collisions?: CollisionQuery | null;
  /** Where a body placed during the match may stand, and what makes it block (10 §5). */
  readonly walls?: PlacedWalls | null;
};
