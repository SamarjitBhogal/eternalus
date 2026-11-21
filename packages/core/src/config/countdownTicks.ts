/**
 * The tick the pre-match countdown ends: `countdownSeconds` of simulation time rounded to a whole
 * tick. The one formula the default timeline, `validateGameConfig`, `SpawnSystem` (first-wave
 * gate) and `GuardRoster` share, so the timeline's countdown-over mark and the first-wave gate
 * stay on the same tick (architecture 12 §3). Takes the two numbers, not a `GameConfig`, because
 * the default config and the validator compute it before a whole config exists.
 *
 * DEC-170 (B1)
 */
export const countdownTicks = (countdownSeconds: number, tickRate: number): number =>
  Math.round(countdownSeconds * tickRate);
