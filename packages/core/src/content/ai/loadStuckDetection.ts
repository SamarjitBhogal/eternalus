import { TickRate } from '../../utils/TickRate';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import type { AuthoredStuckDetectionRule, StuckDetectionRule } from './ai.types';
import { STUCK_DETECTION } from './stuckDetection';

/**
 * Loads the stuck-detection rule: its window from seconds to ticks, once (architecture 03 §8, as
 * `loadStatusEffects` does for statuses), rounded with no one-tick floor.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The rule to load; the shipped one by default.
 * @throws ContentValidationError when the window is negative or not finite.
 */
export const loadStuckDetection = (
  tickRate: number,
  authored: AuthoredStuckDetectionRule = STUCK_DETECTION,
): StuckDetectionRule => {
  const { windowSeconds, ...rest } = authored;
  assertNonNegativeFinite('stuck detection', [['windowSeconds', windowSeconds]]);
  return { ...rest, windowTicks: new TickRate(tickRate).roundToTicks(windowSeconds) };
};
