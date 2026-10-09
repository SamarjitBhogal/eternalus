// Session (wall-clock) timings. They move to content once core has a home for them.

/** Character-select countdown (reference 14 §2: 60 s). */
export const SELECT_COUNTDOWN_MS = 60_000;

/** Pre-launch reveal of the allied team (reference 14 §2: 10 s). */
export const REVEAL_COUNTDOWN_MS = 10_000;

/** Countdowns publish their remaining time once per step. */
export const COUNTDOWN_STEP_MS = 1_000;

// TUNE: only long enough to see the loading screens; goes away with real asset loading.
/** How long a placeholder asset-group load takes. */
export const PLACEHOLDER_LOAD_MS = 1_500;
