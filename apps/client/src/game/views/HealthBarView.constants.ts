import type { HealthBarSide } from './HealthBarView.types';

/**
 * A unit's world health bar (DEC-195): its width as a share of the unit's footprint diameter, so a
 * Legend's bar is wider than a minion's.
 */
// TUNE: placeholder look; no Figma frame draws a world health bar
export const HEALTH_BAR_WIDTH_SCALE = 1.6;

/** Height of a unit's world health bar, in world units. */
// TUNE: placeholder look
export const HEALTH_BAR_HEIGHT = 0.25;

/**
 * Gap between the top of a unit's footprint and its health bar, in world units. It clears the
 * Legend and mob outlines (`LEGEND_OUTLINE_SCALE`, `MOB_OUTLINE_SCALE`).
 */
// TUNE: placeholder look
export const HEALTH_BAR_GAP = 0.5;

/** Colour of the empty part of a unit's world health bar. */
// TUNE: placeholder look
export const HEALTH_BAR_TRACK_COLOR = '#1b1b1b';

/**
 * Colour of the health left on a unit's world health bar, by side (DEC-195): one red for every
 * enemy, one green for every ally. The green is much lighter than the red, so the two differ for
 * red-green colour blindness too; the unit's own tint and outline also show its team (13 §7).
 */
// TUNE: placeholder look; no Figma frame draws a world health bar
export const HEALTH_BAR_FILL_COLORS: Readonly<Record<HealthBarSide, string>> = {
  enemy: '#c8423b',
  ally: '#8fd16f',
};
