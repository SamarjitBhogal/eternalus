import type { PathQuery } from './PathQuery.types';
import type { SpaceQuery } from './SpaceQuery.types';
/** Where a match is in its timeline (architecture 12 §2). */
export type MatchPhase =
  'countdown' | 'early-game' | 'quarter-mark' | 'mid-game' | 'end-game' | 'victory' | 'defeat';

/**
 * A command the simulation applied, with the tick it was applied on. Typed structurally because
 * `state/` may not import `commands/` (architecture 03 §4); every `Command` fits it.
 */
export type RecordedCommand = {
  readonly tick: number;
  readonly command: { readonly type: string };
};

/**
 * One playable team's match counters (architecture 03 §2). `unitsSuppressed` counts the members
 * the unit cap kept out of a horde (architecture 18 §3.4), `unitsRequested` every member asked for.
 */
export type TeamState = {
  readonly unitsRequested: number;
  readonly unitsSuppressed: number;
};

/** The match's spatial indexes, built by `Simulation` (none in most unit tests). */
export type GameStateIndexes = {
  /** Every unit's position at the last rebuild, for neighbour queries (architecture 11 §3). */
  readonly space?: SpaceQuery | null;
  /** A\* for Legends over the map's grid (architecture 10 §9). */
  readonly paths?: PathQuery | null;
};
