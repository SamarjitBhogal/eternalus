import type { TimelineMark } from './MatchTimelineEntry.types';

/**
 * The tick a timeline mark resolves to: `atTick` as it is (absolute, from tick 0), `atFraction` of
 * `plannedMatchSeconds` rounded to a whole tick and counted from `countdownEndTick`, because the
 * pre-match countdown is not match time (architecture 12 §3, DEC-278, DEC-282). The one formula
 * `validateGameConfig` and `MatchTimeline` share, so the order validation checks is the order the
 * match runs.
 */
export const timelineMarkTick = (
  mark: TimelineMark,
  tickRate: number,
  plannedMatchSeconds: number,
  countdownEndTick: number,
): number =>
  'atTick' in mark
    ? mark.atTick
    : countdownEndTick + Math.round(mark.atFraction * plannedMatchSeconds * tickRate);
