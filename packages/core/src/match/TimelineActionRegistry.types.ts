import type { TimelineAction, TimelineActionKind } from '../config/MatchTimelineEntry.types';
import type { DirectorContext } from './DirectorContext.types';

/** Carries out one kind of timeline action (architecture 12 §3). */
export interface TimelineActionHandler<K extends TimelineActionKind> {
  /** Does what `action` asks, through the context: state changes and events only. */
  run(action: TimelineAction<K>, context: DirectorContext): void;
}

/**
 * One handler per action kind; a missing kind does not compile. Built by
 * `defaultTimelineActions.ts`, so a new timed event never touches the director.
 */
export type TimelineActionRegistry = {
  readonly [K in TimelineActionKind]: TimelineActionHandler<K>;
};
