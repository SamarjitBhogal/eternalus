import { FOCUS_RING_COLOR } from './entityViews.constants';

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

/** Colours of one overlay area: its fill and its outline. */
type AimAreaColors = { readonly fill: string; readonly outline: string };

/** Every area but a cone's: the overlay fill and outline above. */
export const AIM_OVERLAY_COLORS: AimAreaColors = {
  fill: AIM_OVERLAY_FILL_COLOR,
  outline: FOCUS_RING_COLOR,
};

/** A cone's fan: darker blue (DEC-206 (3)). */
// TUNE: placeholder shades; DEC-206 (3) names only "darker blue"
export const AIM_CONE_FAN_COLORS: AimAreaColors = {
  fill: 'rgba(29, 78, 216, 0.3)',
  outline: '#1d4ed8',
};

/** A cone of a full turn, the circle of the fan's range: lighter blue (DEC-206 (3)). */
// TUNE: placeholder shades; DEC-206 (3) names only "lighter blue"
export const AIM_CONE_CIRCLE_COLORS: AimAreaColors = {
  fill: 'rgba(147, 197, 253, 0.16)',
  outline: '#93c5fd',
};

/** A cone this wide (degrees) is the whole circle of its reach (core `ConeShape`). */
export const AIM_FULL_TURN_DEGREES = 360;
