import { TickRate } from '../../utils/TickRate';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import { LEGEND_JUMP } from './legendJump';
import type { AuthoredLegendJump, LegendJump } from './legendJump.types';

/**
 * Loads the Legend jump once (DEC-241): the air time from seconds to ticks, rounded and never
 * below one tick, so `JumpSystem` sees only ticks.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The record to load; the shipped one by default.
 * @throws ContentValidationError when the air time or the height is negative or not finite.
 */
export const loadLegendJump = (
  tickRate: number,
  authored: AuthoredLegendJump = LEGEND_JUMP,
): LegendJump => {
  const { airSeconds, peakHeight } = authored;
  assertNonNegativeFinite('legend jump', [['airSeconds', airSeconds]]);
  assertNonNegativeFinite('legend jump', [['peakHeight', peakHeight]], 'm');
  return { airTicks: new TickRate(tickRate).toTicks(airSeconds), peakHeight };
};
