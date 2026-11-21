import type { MatchPhase } from '../config/matchPhases';
import type { GameState } from '../state/GameState';

/** What a phase or a timeline action sees while the `MatchDirector` runs it (architecture 12 §2). */
export type DirectorContext = {
  readonly state: GameState;
  /**
   * Moves the match forward to `phase`: exits the current phase, sets the new one (which emits
   * `phase-changed`), then enters it. A `phase` not after the current one is a bug: it throws
   * when `debug.throwOnViolation` is set, else it is logged and the phase stays as it is.
   */
  readonly enterPhase: (phase: MatchPhase) => void;
};
