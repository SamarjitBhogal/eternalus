/**
 * The tick the pre-match countdown ends: `countdownSeconds` of simulation time rounded to a whole
 * tick. The one formula for it, so the timeline's countdown-over mark and every reader stay on
 * the same tick (architecture 12 §3). Called where the match is built: by the default timeline,
 * and by `timelineFrameOf`, which `validateGameConfig`, `MatchTimeline` and `Simulation` use.
 * `Simulation` hands the tick to `GameState`, which keeps it as `state.match.countdownEndTick`,
 * the one value every runtime reader reads (HC-B9 (1), DEC-285, DEC-286). Takes the two numbers,
 * not a `GameConfig`, because the default config computes it before a whole config exists.
 *
 * DEC-170 (B1)
 */
export const countdownTicks = (countdownSeconds: number, tickRate: number): number =>
  Math.round(countdownSeconds * tickRate);
