/** A group post's respawn tick while some guard of its group still stands. */
export const WAITING_FOR_GROUP = Number.MAX_SAFE_INTEGER;

/** A `never` post's respawn tick once its guard died: it stays empty for the rest of the match. */
export const NEVER_AGAIN = Number.MAX_SAFE_INTEGER - 1;
