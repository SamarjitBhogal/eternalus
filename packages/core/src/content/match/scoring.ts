import type { ScoringWeights } from './scoring.types';

/**
 * The owner's point model (DEC-79, architecture 12 §5). Bosses and the sovereign give no personal
 * points, so they have no line.
 *
 * ponytail: capture and hold points (FR-007; the owner's values: DEC-131, 3 per checkpoint and 1
 * per minute) are not here yet. They are plan task GL-15 (DEC-214), built on
 * `feat/capture-scoring`, stacked on this branch: each joins as a new line here (`TUNE`), a
 * listener and rule in `match/Scoring.ts`, a `ScoreBook` writer and a `TeamStats` counter.
 */
export const SCORING_WEIGHTS = {
  legendKill: 15, // TUNE: DEC-79
  legendKillAssist: 7, // TUNE: DEC-79
  death: 0, // the owner's request of 2026-10-27 (game-loop plan §4.4): no negative points
  minionKill: { 'light-mob': 1, 'medium-mob': 4, 'heavy-mob': 12 }, // DEC-79
  structureDestroyed: 5, // TUNE: DEC-131 (team-only points for the destroying team, DEC-212)
} as const satisfies ScoringWeights;

/** How long a Legend's hit on an enemy Legend still earns an assist when that Legend dies. */
export const ASSIST_WINDOW_SECONDS = 30; // TUNE: DEC-79 (the owner's ruling of 2026-10-19)
