import { TickRate } from '../../utils/TickRate';
import { ContentValidationError } from '../ContentValidationError';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import { ZONE_LEVEL_UP } from './zoneLevelUp';
import type { AuthoredZoneLevelUp, ZoneLevelUpDefinition } from './zones.types';

/**
 * Loads the zone level-up: the hold time from seconds to ticks, once, never below one tick
 * (architecture 03 §8, DEC-241), so `ZoneLevelUpSystem` sees only ticks.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The rules to load; the shipped ones by default.
 * @throws ContentValidationError when the hold time is negative or not finite (DEC-262), or the
 *   levels are not a positive whole number.
 */
export const loadZoneLevelUp = (
  tickRate: number,
  authored: AuthoredZoneLevelUp = ZONE_LEVEL_UP,
): ZoneLevelUpDefinition => {
  assertNonNegativeFinite('zone level-up', [['holdSeconds', authored.holdSeconds]]);
  if (!Number.isInteger(authored.levels) || authored.levels <= 0) {
    throw new ContentValidationError(
      `Invalid zone level-up: levels is ${String(authored.levels)}, not a positive whole number`,
    );
  }
  return {
    holdTicks: new TickRate(tickRate).toTicks(authored.holdSeconds),
    levels: authored.levels,
  };
};
