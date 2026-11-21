import type { TimelineMark } from './MatchTimelineEntry.types';

/**
 * The tick a timeline mark resolves to: `atTick` as it is, `atFraction` of `plannedMatchSeconds`
 * rounded to a whole tick (architecture 12 §3). The one formula `validateGameConfig` and
 * `MatchTimeline` share, so the order validation checks is the order the match runs.
 */
export const timelineMarkTick = (
  mark: TimelineMark,
  tickRate: number,
  plannedMatchSeconds: number,
): number =>
  'atTick' in mark ? mark.atTick : Math.round(mark.atFraction * plannedMatchSeconds * tickRate);
