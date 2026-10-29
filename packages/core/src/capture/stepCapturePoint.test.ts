import { describe, expect, it } from 'vitest';
import type { Team } from '../teams/teams.types';
import { CapturePointStore } from './CapturePointStore';
import type { CapturePointState, CaptureRules } from './CapturePoint.types';
import { isInsideCapturePoint, stepCapturePoint } from './stepCapturePoint';

const NEUTRAL = 'neutral' as Team;
const LIGHT = 'light' as Team;
const DARK = 'dark' as Team;
// 1 tick per second and 3-second captures keep the numbers readable.
const RULES: CaptureRules = {
  captureSeconds: 3,
  decaySeconds: 6,
  maxCaptureMultiplier: 3,
  checkpoints: 3,
  keepOwnershipWhenEmpty: false,
};
const TICK_RATE = 1;

function freshPoint(): CapturePointState {
  const store = new CapturePointStore(
    [{ id: 'cp', lane: 'mid', center: { x: 0, y: 0 }, halfSize: 10 }],
    NEUTRAL,
  );
  let point: CapturePointState | undefined;
  store.forEach((p) => {
    point = p;
  });
  if (point === undefined) throw new Error('no point');
  return point;
}

function step(point: CapturePointState, occupancy: Record<string, number>, ticks = 1) {
  let last: ReturnType<typeof stepCapturePoint> = { ownerChanged: null, checkpointChanged: false };
  for (let i = 0; i < ticks; i += 1) {
    last = stepCapturePoint(
      point,
      new Map(Object.entries(occupancy) as [Team, number][]),
      RULES,
      TICK_RATE,
      NEUTRAL,
    );
  }
  return last;
}

describe('isInsideCapturePoint', () => {
  const zone = { id: 'cp', lane: 'mid', center: { x: 100, y: 100 }, halfSize: 10 };
  it('counts the edges as inside and anything past them as outside', () => {
    expect(isInsideCapturePoint(zone, { x: 110, y: 90 })).toBe(true);
    expect(isInsideCapturePoint(zone, { x: 110.1, y: 100 })).toBe(false);
  });
});

describe('stepCapturePoint', () => {
  it('starts neutral and one unit captures it in captureSeconds, passing each checkpoint', () => {
    const point = freshPoint();
    stepCapturePoint(point, new Map([[LIGHT, 1]]), RULES, TICK_RATE, NEUTRAL);
    expect(point.checkpoint).toBe(1);
    expect(point.owner).toBe(NEUTRAL);
    stepCapturePoint(point, new Map([[LIGHT, 1]]), RULES, TICK_RATE, NEUTRAL);
    const last = stepCapturePoint(point, new Map([[LIGHT, 1]]), RULES, TICK_RATE, NEUTRAL);
    expect(point.progress).toBe(1);
    expect(point.checkpoint).toBe(3);
    expect(last.ownerChanged).toEqual({ from: NEUTRAL, to: LIGHT });
  });

  it('captures faster with more units, up to the cap', () => {
    const point = freshPoint();
    const result = stepCapturePoint(point, new Map([[LIGHT, 5]]), RULES, TICK_RATE, NEUTRAL);
    expect(point.owner).toBe(LIGHT);
    expect(result.ownerChanged).not.toBeNull();
  });

  it('freezes while contested', () => {
    const point = freshPoint();
    stepCapturePoint(point, new Map([[LIGHT, 1]]), RULES, TICK_RATE, NEUTRAL);
    const before = point.progress;
    stepCapturePoint(
      point,
      new Map([
        [LIGHT, 2],
        [DARK, 1],
      ]),
      RULES,
      TICK_RATE,
      NEUTRAL,
    );
    expect(point.contested).toBe(true);
    expect(point.progress).toBe(before);
  });

  it('freezes while locked', () => {
    const point = freshPoint();
    point.locked = true;
    stepCapturePoint(point, new Map([[LIGHT, 3]]), RULES, TICK_RATE, NEUTRAL);
    expect(point.progress).toBe(0);
  });

  it('an enemy drains the owner to neutral first, then captures it', () => {
    const point = freshPoint();
    step(point, { [LIGHT]: 3 });
    expect(point.owner).toBe(LIGHT);
    const neutralised = step(point, { [DARK]: 3 });
    expect(neutralised.ownerChanged).toEqual({ from: LIGHT, to: NEUTRAL });
    const taken = step(point, { [DARK]: 3 });
    expect(taken.ownerChanged).toEqual({ from: NEUTRAL, to: DARK });
  });

  it('an empty neutral point decays back to 0', () => {
    const point = freshPoint();
    stepCapturePoint(point, new Map([[LIGHT, 1]]), RULES, TICK_RATE, NEUTRAL);
    step(point, {}, 10);
    expect(point.progress).toBe(0);
    expect(point.progressTeam).toBe(NEUTRAL);
  });

  it('an owned point drains back to neutral once everyone leaves', () => {
    const point = freshPoint();
    step(point, { [LIGHT]: 3 });
    expect(point.owner).toBe(LIGHT);
    step(point, {}, 5);
    expect(point.owner).toBe(LIGHT);
    const last = step(point, {}, 1);
    expect(point.progress).toBe(0);
    expect(point.owner).toBe(NEUTRAL);
    expect(last.ownerChanged).toEqual({ from: LIGHT, to: NEUTRAL });
  });

  it('with keepOwnershipWhenEmpty, an owned point refills toward its owner', () => {
    const keep: CaptureRules = { ...RULES, keepOwnershipWhenEmpty: true };
    const point = freshPoint();
    stepCapturePoint(point, new Map([[LIGHT, 3]]), keep, TICK_RATE, NEUTRAL);
    stepCapturePoint(point, new Map([[DARK, 1]]), keep, TICK_RATE, NEUTRAL);
    expect(point.progress).toBeLessThan(1);
    for (let i = 0; i < 10; i += 1) {
      stepCapturePoint(point, new Map(), keep, TICK_RATE, NEUTRAL);
    }
    expect(point.progress).toBe(1);
    expect(point.owner).toBe(LIGHT);
    expect(point.heldTicks).toBeGreaterThan(0);
  });
});
