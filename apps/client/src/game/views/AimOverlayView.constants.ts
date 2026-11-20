/** Outline of the range overlay: the player's focus-ring yellow (`FOCUS_RING_COLOR`). */
export { FOCUS_RING_COLOR as AIM_OVERLAY_OUTLINE_COLOR } from './entityViews.constants';

/** Fill of the range overlay: the outline colour at low opacity, so units show through. */
// TUNE: placeholder look; no Figma frame draws a range overlay
export const AIM_OVERLAY_FILL_COLOR = 'rgba(255, 224, 102, 0.18)';

/** Width of the range overlay's outline, in screen pixels. */
// TUNE: placeholder look
export const AIM_OVERLAY_OUTLINE_WIDTH = 2;

/** How many corners approximate a circle (the renderer draws polygons and paths only). */
export const AIM_CIRCLE_SEGMENTS = 48;
