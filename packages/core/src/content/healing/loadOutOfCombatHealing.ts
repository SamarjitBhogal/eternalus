import { TickRate } from '../../utils/TickRate';
import { assertValidSeconds } from '../assertValidSeconds';
import { OUT_OF_COMBAT_HEALING } from './outOfCombatHealing';
import type { AuthoredOutOfCombatHealing, OutOfCombatHealing } from './outOfCombatHealing.types';

/**
 * Loads out-of-combat healing once (architecture 03 §8, DEC-241): its delay and its structure quiet
 * time from seconds to ticks, rounded with no one-tick floor, and its rates from per second to per
 * tick, so the system sees only ticks.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The record to load; the shipped one by default.
 * @throws ContentValidationError when a time or a rate is negative or not finite.
 */
export const loadOutOfCombatHealing = (
  tickRate: number,
  authored: AuthoredOutOfCombatHealing = OUT_OF_COMBAT_HEALING,
): OutOfCombatHealing => {
  const { delaySeconds, healthFractionPerSecond, structureQuietSeconds, structureBonuses } =
    authored;
  const bonuses = Object.entries(structureBonuses);
  assertValidSeconds('out-of-combat healing', [
    ['delaySeconds', delaySeconds],
    ['structureQuietSeconds', structureQuietSeconds],
  ]);
  assertValidSeconds(
    'out-of-combat healing',
    [
      ['healthFractionPerSecond', healthFractionPerSecond],
      ...bonuses.map(
        ([kind, bonus]) => [`${kind} fractionPerSecond`, bonus.fractionPerSecond] as const,
      ),
    ],
    'per s',
  );
  const rate = new TickRate(tickRate);
  return {
    delayTicks: rate.roundToTicks(delaySeconds),
    healthFractionPerTick: healthFractionPerSecond / tickRate,
    structureQuietTicks: rate.roundToTicks(structureQuietSeconds),
    structureBonuses: Object.fromEntries(
      bonuses.map(([kind, { fractionPerSecond, zone }]) => [
        kind,
        { fractionPerTick: fractionPerSecond / tickRate, zone },
      ]),
    ),
  };
};
