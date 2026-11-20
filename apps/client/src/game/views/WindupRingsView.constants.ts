/** How many rings close in on a Legend that winds up. */
// TUNE: placeholder look (DEC-283: "orange rings"); no Figma frame draws the wind-up
export const WINDUP_RING_COUNT = 3;

/**
 * Each ring's size at the start of the wind-up, as a multiple of the Legend's diameter: the
 * innermost ring, then each next one `WINDUP_RING_SPACING` wider. They start a short way out from
 * the Legend (DEC-283: "start at a small range").
 */
// TUNE: placeholder look
export const WINDUP_RING_START_SCALE = 2.2;

/** How much wider each ring starts than the one inside it, as a multiple of the diameter. */
// TUNE: placeholder look
export const WINDUP_RING_SPACING = 0.6;

/** Colour of the rings (DEC-283: "orange"). */
// TUNE: placeholder look
export const WINDUP_RING_COLOR = '#ff8a1f';
