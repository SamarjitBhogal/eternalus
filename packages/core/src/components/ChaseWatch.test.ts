import { describe, expect, it } from 'vitest';
import { ChaseWatch } from './ChaseWatch';

const RULE = { windowTicks: 60, minProgress: 1 };
/** The rule at `tick`. */
const at = (tick: number) => ({ ...RULE, tick });

describe('ChaseWatch', () => {
  it('is stuck once it has not come minProgress closer for the window, then starts a fresh one', () => {
    const watch = new ChaseWatch();

    expect(watch.observe('enemy', 10, false, at(0))).toBe(false);
    // 0.9 m closer is no progress: the window still runs from tick 0.
    expect(watch.observe('enemy', 9.1, false, at(59))).toBe(false);
    expect(watch.observe('enemy', 9.1, false, at(60))).toBe(true);
    expect(watch.observe('enemy', 9.1, false, at(61))).toBe(false);
    expect(watch.observe('enemy', 9.1, false, at(120))).toBe(true);
  });

  it('starts a fresh window on progress, on a new target and while in reach', () => {
    const watch = new ChaseWatch();
    watch.observe('enemy', 10, false, at(0));

    expect(watch.observe('enemy', 9, false, at(50))).toBe(false);
    expect(watch.observe('enemy', 9, false, at(100))).toBe(false);
    expect(watch.observe('other', 9, false, at(140))).toBe(false);
    expect(watch.observe('other', 9, false, at(199))).toBe(false);
    expect(watch.observe('other', 9, true, at(200))).toBe(false);
    expect(watch.observe('other', 9, false, at(259))).toBe(false);
    expect(watch.observe('other', 9, false, at(260))).toBe(true);
  });

  it('heads for a waypoint, judging progress toward it, until it drops it or comes in reach', () => {
    const watch = new ChaseWatch();
    watch.observe('enemy', 10, false, at(0));
    watch.headFor(3, 4, 5, 60);

    expect(watch.waypoint).toEqual({ x: 3, y: 4 });
    expect(watch.waypointFor('enemy')).toEqual({ x: 3, y: 4 });
    expect(watch.waypointFor('other')).toBeNull();
    expect(watch.fields).toEqual(['enemy', 5, 60, true, 3, 4, false]);
    expect(watch.observe('enemy', 4, false, at(100))).toBe(false);
    expect(watch.observe('enemy', 4, false, at(160))).toBe(true);
    watch.dropWaypoint(8, 160);
    expect(watch.waypoint).toBeNull();
    expect(watch.fields).toEqual(['enemy', 8, 160, false, 3, 4, false]);

    watch.headFor(3, 4, 5, 170);
    watch.observe('enemy', 5, true, at(171));
    expect(watch.waypoint).toBeNull();
  });

  it('keeps a plan due until it heads for a waypoint, drops it, or the chase starts afresh', () => {
    const watch = new ChaseWatch();
    watch.observe('enemy', 10, false, at(0));
    expect(watch.isPlanDue).toBe(false);

    watch.requestPlan();
    expect(watch.isPlanDue).toBe(true);
    expect(watch.fields.at(-1)).toBe(true);
    expect(watch.observe('enemy', 10, false, at(1))).toBe(false);
    expect(watch.isPlanDue).toBe(true);
    watch.headFor(3, 4, 5, 2);
    expect(watch.isPlanDue).toBe(false);

    watch.requestPlan();
    watch.dropWaypoint(8, 3);
    expect(watch.isPlanDue).toBe(false);

    watch.requestPlan();
    watch.observe('other', 8, false, at(4));
    expect(watch.isPlanDue).toBe(false);
    watch.requestPlan();
    watch.observe('other', 8, true, at(5));
    expect(watch.isPlanDue).toBe(false);
  });
});
