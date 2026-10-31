/**
 * Utility considerations (architecture 11 §4.2): pure functions from a situation's numbers to a
 * score from 0 to 1, higher meaning more attractive.
 */

/** 1 for a target at the bot's feet, 0 at `radius` and beyond. */
export const closeness = (distance: number, radius: number): number =>
  radius <= 0 ? 0 : Math.max(0, 1 - distance / radius);

/** `value` as a share of `max`, from 0 to 1 (a lane's pressure out of the most it can be). */
export const share = (value: number, max: number): number =>
  max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));

/** 1 for a target with no health left, 0 for one at full health. */
export const weakness = (healthFraction: number): number =>
  Math.min(1, Math.max(0, 1 - healthFraction));
