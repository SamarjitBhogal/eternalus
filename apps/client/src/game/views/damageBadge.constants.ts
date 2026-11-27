/**
 * The badge timing and places that `DamageBadges` and `DamageBadgeLayer` share (W5b, DEC-410).
 */

/**
 * How long a badge shows at full strength after it appears, then how long it takes to fade
 * (W5b: "stays about 1 s, then fades"). A badge is gone after both.
 */
// TUNE: W5b (DEC-410)
export const BADGE_HOLD_SECONDS = 1;
// TUNE: W5b (DEC-410)
export const BADGE_FADE_SECONDS = 0.35;
export const BADGE_LIFETIME_SECONDS = BADGE_HOLD_SECONDS + BADGE_FADE_SECONDS;

/**
 * Where each of a target's side-by-side places sits, in `BADGE_SPACING` steps from its centre:
 * one entry per place, so its length is W5b's stack limit ("up to 4 side by side"). The first
 * badge sits in the middle; the next ones go left, right, then right again.
 */
// TUNE: W5b (DEC-410)
export const BADGE_SLOT_OFFSETS: readonly number[] = [0, -1, 1, 2];
