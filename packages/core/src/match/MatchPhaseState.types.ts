import type { MatchPhase } from '../config/matchPhases';
import type { DirectorContext } from './DirectorContext.types';

/**
 * The rules of one match phase (State pattern, architecture 12 §2). A phase changes state and
 * emits events; it never spawns directly and never calls a system.
 */
export interface MatchPhaseState {
  readonly phase: MatchPhase;
  /** Runs once when the match enters this phase. */
  enter(context: DirectorContext): void;
  /** Runs every tick while the match is in this phase, after the due timeline entries. */
  update(context: DirectorContext): void;
  /** Runs once when the match leaves this phase, before the next one is entered. */
  exit(context: DirectorContext): void;
}

/** One state per phase; a missing phase does not compile. Built by `defaultMatchPhases.ts`. */
export type MatchPhaseRegistry = Readonly<Record<MatchPhase, MatchPhaseState>>;
