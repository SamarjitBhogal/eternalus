import type { ScoringWeights } from './scoring.types';

/**
 * The owner's point model (DEC-79, architecture 12 §5). Bosses and the sovereign give no personal
 * points, so they have no line.
 *
 * ponytail: points for structures, captures and holds (FR-007; the owner's values: DEC-131) are not
 * here, because those entities are not built. Each joins as a new line here (`TUNE`), a listener
 * in `match/Scoring.ts` and, for team-only points, a field in `TeamStats`.
 */
export const SCORING_WEIGHTS = {
  legendKill: 15, // TUNE: DEC-79
  legendKillAssist: 7, // TUNE: DEC-79
  death: 0, // the owner's request of 2026-10-27 (game-loop plan §4.4): no negative points
  minionKill: { 'light-mob': 1, 'medium-mob': 4, 'heavy-mob': 12 }, // DEC-79
} as const satisfies ScoringWeights;

/** How long a Legend's hit on an enemy Legend still earns an assist when that Legend dies. */
export const ASSIST_WINDOW_SECONDS = 30; // TUNE: DEC-79 (the owner's ruling of 2026-10-19)
