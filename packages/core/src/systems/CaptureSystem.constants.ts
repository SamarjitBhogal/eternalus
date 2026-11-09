import type { Team } from '../teams/teams.types';

/** The sides that can push a zone, in the order their weights are summed (stable ties). */
export const CAPTURE_SIDES: readonly Team[] = ['light', 'dark', 'neutral'];

/**
 * How close progress must come to a locking state or a checkpoint to count as there: it absorbs
 * the rounding left by adding many small per-tick steps.
 */
export const PROGRESS_EPSILON = 1e-9;
