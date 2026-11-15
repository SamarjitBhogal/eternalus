import { TickRate } from '../../utils/TickRate';
import { assertValidSeconds } from '../assertValidSeconds';
import { OUT_OF_COMBAT_HEALING } from './outOfCombatHealing';
import type { AuthoredOutOfCombatHealing, OutOfCombatHealing } from './outOfCombatHealing.types';

/**
 * Loads out-of-combat healing: its delay and its structure quiet time from seconds to ticks, once
 * (architecture 03 §8, DEC-241), rounded with no one-tick floor. The rates stay per second.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The record to load; the shipped one by default.
 * @throws ContentValidationError when a time is negative or not finite.
 */
export const loadOutOfCombatHealing = (
  tickRate: number,
  authored: AuthoredOutOfCombatHealing = OUT_OF_COMBAT_HEALING,
): OutOfCombatHealing => {
  const { delaySeconds, structureQuietSeconds, ...rest } = authored;
  assertValidSeconds('out-of-combat healing', [
    ['delaySeconds', delaySeconds],
    ['structureQuietSeconds', structureQuietSeconds],
  ]);
  const rate = new TickRate(tickRate);
  return {
    ...rest,
    delayTicks: rate.roundToTicks(delaySeconds),
    structureQuietTicks: rate.roundToTicks(structureQuietSeconds),
  };
};
