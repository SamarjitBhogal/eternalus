import { describe, expect, it } from 'vitest';
import { ChaseWatch } from './ChaseWatch';

const RULE = { windowTicks: 60, minProgress: 1 };

describe('ChaseWatch', () => {
  it('is stuck once it has not come minProgress closer for the window, then starts a fresh one', () => {
    const watch = new ChaseWatch();

    expect(watch.observe('enemy', 10, false, 0, RULE)).toBe(false);
    // 0.9 m closer is no progress: the window still runs from tick 0.
    expect(watch.observe('enemy', 9.1, false, 59, RULE)).toBe(false);
    expect(watch.observe('enemy', 9.1, false, 60, RULE)).toBe(true);
    expect(watch.observe('enemy', 9.1, false, 61, RULE)).toBe(false);
    expect(watch.observe('enemy', 9.1, false, 120, RULE)).toBe(true);
  });

  it('starts a fresh window on progress, on a new target and while in reach', () => {
    const watch = new ChaseWatch();
    watch.observe('enemy', 10, false, 0, RULE);

    expect(watch.observe('enemy', 9, false, 50, RULE)).toBe(false);
    expect(watch.observe('enemy', 9, false, 100, RULE)).toBe(false);
    expect(watch.observe('other', 9, false, 140, RULE)).toBe(false);
    expect(watch.observe('other', 9, false, 199, RULE)).toBe(false);
    expect(watch.observe('other', 9, true, 200, RULE)).toBe(false);
    expect(watch.observe('other', 9, false, 259, RULE)).toBe(false);
    expect(watch.observe('other', 9, false, 260, RULE)).toBe(true);
  });

  it('heads for a waypoint, judging progress toward it, until it drops it or comes in reach', () => {
    const watch = new ChaseWatch();
    watch.observe('enemy', 10, false, 0, RULE);
    watch.headFor(3, 4, 5, 60);

    expect(watch.waypoint).toEqual({ x: 3, y: 4 });
    expect(watch.fields).toEqual(['enemy', 5, 60, true, 3, 4]);
    expect(watch.observe('enemy', 4, false, 100, RULE)).toBe(false);
    expect(watch.observe('enemy', 4, false, 160, RULE)).toBe(true);
    watch.dropWaypoint(8, 160);
    expect(watch.waypoint).toBeNull();
    expect(watch.fields).toEqual(['enemy', 8, 160, false, 3, 4]);

    watch.headFor(3, 4, 5, 170);
    watch.observe('enemy', 5, true, 171, RULE);
    expect(watch.waypoint).toBeNull();
  });
});
