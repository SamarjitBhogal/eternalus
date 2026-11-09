import type { DirectorContext } from './DirectorContext.types';

/**
 * What the `MatchDirector` asks of scoring (architecture 12 §4, DEC-211 (4)): once per tick, after
 * the phase update and before the verdict, apply what the tick's events earned to the match's
 * `ScoreBook`. `Scoring` implements it; a test can pass a double.
 */
export interface ScoreKeeper {
  /** Applies the tick's buffered scoring events, in the order they happened. */
  fold(context: DirectorContext): void;
}
