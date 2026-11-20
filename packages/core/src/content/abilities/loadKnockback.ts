import { TickRate } from '../../utils/TickRate';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import type { AuthoredKnockback, KnockbackDefinition } from './knockback';
import { KNOCKBACK } from './knockback';

/**
 * Loads the knock-back tuning once (architecture 03 §8, DEC-241): its travel time from seconds to
 * ticks, never below one tick, so `KnockbackEffect` sees only ticks.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The tuning to load; the shipped one by default.
 * @throws ContentValidationError when the travel time is negative or not finite.
 */
export const loadKnockback = (
  tickRate: number,
  authored: AuthoredKnockback = KNOCKBACK,
): KnockbackDefinition => {
  const { travelSeconds, ...rest } = authored;
  assertNonNegativeFinite('knock-back', [['travelSeconds', travelSeconds]]);
  return { ...rest, travelTicks: new TickRate(tickRate).toTicks(travelSeconds) };
};
