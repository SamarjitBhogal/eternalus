import { sqrt } from '../utils/deterministicMath';

/**
 * The speed a shot flies at next tick (DEC-306), in the units of `topSpeed` per tick: `topSpeed`
 * until it has flown `slowFrom`, then `topSpeed` times the square root of the share of the slow zone
 * left, so it eases to a stop at `range`. Never more than the distance left, so the last move lands
 * exactly on `range`.
 *
 * @param topSpeed - Full speed per tick.
 * @param flown - Metres flown from the origin so far.
 * @param range - Where the shot stops, metres from the origin.
 * @param slowFrom - Where it starts to slow, metres from the origin; at most `range`.
 */
export const flightSpeed = (
  topSpeed: number,
  flown: number,
  range: number,
  slowFrom: number,
): number => {
  const remaining = Math.max(0, range - flown);
  if (flown < slowFrom || range <= slowFrom) return Math.min(topSpeed, remaining);
  return Math.min(topSpeed * sqrt(remaining / (range - slowFrom)), remaining);
};
