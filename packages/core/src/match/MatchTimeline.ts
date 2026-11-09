import type { GameConfig } from '../config/GameConfig.types';
import { timelineMarkTick } from '../config/timelineMarkTick';
import type { ScheduledMark } from '../state/MatchState.types';
import { deepFreeze } from '../utils/deepFreeze';
import type { ResolvedTimelineEntry } from './MatchTimeline.types';

/** A match's timeline with every mark resolved to a tick, in firing order (architecture 12 §3). */
export class MatchTimeline {
  /** @param entries - The resolved entries, already in firing order. */
  public constructor(public readonly entries: readonly ResolvedTimelineEntry[]) {}

  /**
   * Resolves `config.match.timeline` once, at match construction: each mark becomes a tick
   * (`atFraction` of `plannedMatchSeconds`), then entries are sorted by tick. The sort is
   * stable, so entries on one tick keep their config order.
   */
  public static resolve({ tickRate, match }: GameConfig): MatchTimeline {
    const entries = match.timeline.map(({ id, at, action }) => ({
      id,
      tick: timelineMarkTick(at, tickRate, match.plannedMatchSeconds),
      action,
    }));
    return new MatchTimeline(deepFreeze(entries.toSorted((a, b) => a.tick - b.tick)));
  }

  /** The `{ entryId, tick }` marks `state.match.schedule` keeps, in the same order. */
  public schedule(): readonly ScheduledMark[] {
    return this.entries.map(({ id, tick }) => ({ entryId: id, tick }));
  }
}
