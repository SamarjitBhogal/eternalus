// Session (wall-clock) timings. They move to content once core has a home for them.

/**
 * Character-select countdown (reference 14 §2: 60 s). It always runs in full, even after an early
 * LOCK IN (DEC-60).
 */
export const SELECT_COUNTDOWN_MS = 60_000;

/** Pre-launch reveal of the allied team (reference 14 §2: 10 s). */
export const REVEAL_COUNTDOWN_MS = 10_000;

/**
 * How long the world runs on after `match-ended` before the win/lose screen (DEC-92: 5 s).
 * ponytail: session timing beside the countdown below (game-loop plan A18); plan task GL-11 moves
 * both to core content.
 */
export const RESULTS_DELAY_MS = 5_000;

/**
 * The win/lose screen's countdown (DEC-78: 30 s), then the menu; Continue skips it.
 * ponytail: session timing (game-loop plan A18); plan task GL-11 moves it to core content.
 */
export const RESULTS_COUNTDOWN_MS = 30_000;

/** Countdowns publish their remaining time once per step. */
export const COUNTDOWN_STEP_MS = 1_000;
