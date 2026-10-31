import type { ScoringWeights } from '../content/match/scoring.types';
import type { ScoringState } from '../state/ScoringState.types';

/** The content values `Scoring` counts with; `Simulation` passes them in (12 §1, rule 11). */
export type ScoringOptions = {
  /** The points per kill, assist and death (`content/match/scoring.ts`). */
  readonly weights: ScoringWeights;
  /** How long a hit on an enemy Legend still earns an assist, in seconds. */
  readonly assistWindowSeconds: number;
};

/** One buffered event, applied to the scoring state by `Scoring.fold`. */
export type PendingChange = (scoring: ScoringState) => void;
