import type { ScoringWeights } from './scoring.types';

/**
 * The owner's point model (DEC-79, architecture 12 §5) and FR-007's objective points (DEC-131).
 * Bosses and the sovereign give no personal points, so they have no line.
 */
export const SCORING_WEIGHTS = {
  legendKill: 15, // TUNE: DEC-79
  legendKillAssist: 7, // TUNE: DEC-79
  death: 0, // the owner's request of 2026-10-27 (game-loop plan §4.4): no negative points
  minionKill: { 'light-mob': 1, 'medium-mob': 4, 'heavy-mob': 12 }, // DEC-79
  structureDestroyed: 5, // TUNE: DEC-131 (team-only points for the destroying team, DEC-212)
  captureCheckpoint: 3, // TUNE: DEC-131 (team-only, DEC-214)
  holdPerMinute: 1, // TUNE: DEC-131 (pooled, DEC-214)
} as const satisfies ScoringWeights;

/** How long a Legend's hit on an enemy Legend still earns an assist when that Legend dies. */
export const ASSIST_WINDOW_SECONDS = 30; // TUNE: DEC-79 (the owner's ruling of 2026-10-19)
