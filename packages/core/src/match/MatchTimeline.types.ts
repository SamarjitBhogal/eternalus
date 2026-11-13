import type { TimelineAction } from '../config/MatchTimelineEntry.types';

/** A timeline entry with its mark resolved to a tick. */
export type ResolvedTimelineEntry = {
  readonly id: string;
  readonly tick: number;
  readonly action: TimelineAction;
};
