import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MatchTimelineEntry, TimelineMark } from '../config/MatchTimelineEntry.types';
import { MatchTimeline } from './MatchTimeline';

const entry = (id: string, at: TimelineMark): MatchTimelineEntry => ({
  id,
  at,
  action: { kind: 'enter-phase', phase: 'early-game' },
});

/** Resolves `timeline` with a 100 s planned match at 30 ticks/s (3,000 ticks). */
const resolve = (timeline: readonly MatchTimelineEntry[]) =>
  MatchTimeline.resolve(createDefaultGameConfig({ match: { plannedMatchSeconds: 100, timeline } }))
    .entries;

describe('MatchTimeline', () => {
  it('resolves a fraction against plannedMatchSeconds, rounded to a whole tick', () => {
    expect(
      resolve([
        entry('quarter', { atFraction: 0.25 }),
        entry('third', { atFraction: 1 / 3 }),
        entry('end', { atFraction: 1 }),
      ]).map(({ tick }) => tick),
    ).toEqual([750, 1000, 3000]);
  });

  it('keeps an atTick mark as it is', () => {
    expect(resolve([entry('start', { atTick: 0 }), entry('late', { atTick: 9999 })])).toEqual([
      { id: 'start', tick: 0, action: { kind: 'enter-phase', phase: 'early-game' } },
      { id: 'late', tick: 9999, action: { kind: 'enter-phase', phase: 'early-game' } },
    ]);
  });

  it('sorts entries by tick', () => {
    expect(
      resolve([
        entry('mid', { atFraction: 0.5 }),
        entry('countdown', { atTick: 60 }),
        entry('quarter', { atFraction: 0.25 }),
      ]).map(({ id }) => id),
    ).toEqual(['countdown', 'quarter', 'mid']);
  });

  it('keeps config order for entries on the same tick', () => {
    const ids = (timeline: readonly MatchTimelineEntry[]) => resolve(timeline).map(({ id }) => id);

    expect(ids([entry('a', { atTick: 750 }), entry('b', { atFraction: 0.25 })])).toEqual([
      'a',
      'b',
    ]);
    expect(ids([entry('b', { atFraction: 0.25 }), entry('a', { atTick: 750 })])).toEqual([
      'b',
      'a',
    ]);
  });

  it('resolves the default timeline: the 10 s countdown, then quarters of the 30-minute match', () => {
    expect(MatchTimeline.resolve(createDefaultGameConfig()).schedule()).toEqual([
      { entryId: 'countdown-over', tick: 300 },
      { entryId: 'quarter-mark', tick: 13_500 },
      { entryId: 'mid-game', tick: 27_000 },
      { entryId: 'end-game', tick: 40_500 },
    ]);
  });

  it('returns frozen entries', () => {
    const entries = resolve([entry('a', { atTick: 1 })]);

    expect(Object.isFrozen(entries)).toBe(true);
    expect(Object.isFrozen(entries[0])).toBe(true);
  });
});
