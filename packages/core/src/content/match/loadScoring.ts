import { TickRate } from '../../utils/TickRate';
import { assertNonNegativeFinite } from '../assertNonNegativeFinite';
import { SCORING } from './scoring';
import type { AuthoredScoringOptions, ScoringOptions } from './scoring.types';

/** Seconds in a minute: hold points come per full minute of held time (DEC-214 (A2)). */
const SECONDS_PER_MINUTE = 60;

/**
 * Loads the scoring values once (architecture 03 §8, DEC-241), so the scoring rules and the
 * factory that builds them see only ticks: the assist window from seconds to ticks (DEC-285 (2))
 * and the minute that hold points count in (DEC-287). It keeps the conversion
 * `createDefaultScoringRules` used before, `TickRate.toTicks`: rounded, never below one tick.
 *
 * @param tickRate - Ticks per second (`GameConfig.tickRate`).
 * @param authored - The values to load; the shipped `SCORING` by default.
 * @throws ContentValidationError when the assist window is negative or not finite.
 */
export const loadScoring = (
  tickRate: number,
  authored: AuthoredScoringOptions = SCORING,
): ScoringOptions => {
  const { assistWindowSeconds, ...base } = authored;
  assertNonNegativeFinite('scoring', [['assistWindowSeconds', assistWindowSeconds]]);
  const ticks = new TickRate(tickRate);
  return {
    ...base,
    assistWindowTicks: ticks.toTicks(assistWindowSeconds),
    minuteTicks: ticks.toTicks(SECONDS_PER_MINUTE),
  };
};
