/** Colour behind the map, only visible if the view ever reaches past the map's edges. */
export const BACKGROUND_COLOR = '#2b2620';

/** The loop's frame clamp, in ticks: a frame may run at most this many (architecture 08 §2). */
export const MAX_TICKS_PER_FRAME = 5;

/** Share of the distance to the player the camera covers each frame (smooth follow). TUNE. */
export const CAMERA_SMOOTHING = 0.2;

/** How much of the world the following camera shows left to right, in metres. TUNE: zoom. */
export const FOLLOW_VIEW_WIDTH = 64;

/** How much of the world the following camera shows top to bottom (16:9 with the width). TUNE. */
export const FOLLOW_VIEW_HEIGHT = 36;

/** The match seed until match setup (session E) chooses one. */
export const PLACEHOLDER_MATCH_SEED = 1;

/** How many log records the match keeps for bug reports and the overlay (architecture 15 §5). */
export const LOG_RING_CAPACITY = 512;
