import { TickRate } from '../../utils/TickRate';
import { ContentValidationError } from '../ContentValidationError';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import { ZONE_DEFINITIONS } from './zoneCatalogue';
import type { ZoneDefinition, ZoneLevelUpDefinition } from './zones.types';

/**
 * Loads every zone's level-up (`ZoneDefinition.levelUp`, DEC-353 (c)), keyed by zone definition
 * id: the hold time from seconds to ticks, once, never below one tick (architecture 03 §8,
 * DEC-241), so `ZoneLevelUpSystem` sees only ticks.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param zones - The zone definitions to load; the shipped ones by default.
 * @throws ContentValidationError when a hold time is negative or not finite (DEC-262), or the
 *   levels are not a positive whole number.
 */
export const loadZoneLevelUp = (
  tickRate: number,
  zones: readonly ZoneDefinition[] = ZONE_DEFINITIONS.all(),
): ReadonlyMap<string, ZoneLevelUpDefinition> => {
  const rate = new TickRate(tickRate);
  return new Map(
    zones.map(({ id, levelUp }) => {
      assertNonNegativeFinite(`zone level-up of ${id}`, [['holdSeconds', levelUp.holdSeconds]]);
      if (!Number.isInteger(levelUp.levels) || levelUp.levels <= 0) {
        throw new ContentValidationError(
          `Invalid zone level-up of ${id}: levels is ${String(levelUp.levels)}, not a positive whole number`,
        );
      }
      return [id, { holdTicks: rate.toTicks(levelUp.holdSeconds), levels: levelUp.levels }];
    }),
  );
};
