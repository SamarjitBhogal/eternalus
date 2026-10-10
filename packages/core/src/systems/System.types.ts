import type { Logger } from '../diagnostics/Logger.types';
import type { GameState } from '../state/GameState';

/** What a system sees during a tick: the state (with its RNG and events) and the logger. */
export type SystemContext = {
  readonly state: GameState;
  readonly logger: Logger;
};

/**
 * Per-tick logic. A system keeps no reference to another system: it reads and changes state and
 * talks to the others through `state.events` (architecture 01 rule 12).
 */
export interface System {
  /** A stable name for logs and profiling, e.g. `movement`. */
  readonly name: string;
  /** Runs this system's share of the current tick. */
  update(context: SystemContext): void;
}
