import { countdownTicks } from './countdownTicks';
import type { GameConfig } from './GameConfig.types';
import type { TimelineFrame } from './MatchTimelineEntry.types';

/** The config fields a `TimelineFrame` reads; the validator has them before a whole config. */
type TimelineFrameSource = {
  readonly tickRate: GameConfig['tickRate'];
  readonly match: Pick<GameConfig['match'], 'plannedMatchSeconds' | 'countdownSeconds'>;
};

/**
 * What a match's timeline marks resolve against, built from its config in one place (DEC-286):
 * `MatchTimeline.resolve`, `validateGameConfig`, and `Simulation`, which hands its
 * `countdownEndTick` to `GameState`.
 */
export const timelineFrameOf = ({ tickRate, match }: TimelineFrameSource): TimelineFrame => ({
  tickRate,
  plannedMatchSeconds: match.plannedMatchSeconds,
  countdownEndTick: countdownTicks(match.countdownSeconds, tickRate),
});
