import { describe, expect, it } from 'vitest';

import { Momentum } from './Momentum';
import type { MutableVec2 } from '../utils/vec2.types';

// The Sentinel's authored numbers (content/legends/sentinel.ts), loaded at 30 ticks per second.
const TICKS = 30;
const MAX_SPEED = 9 / TICKS;
const ACCELERATION = 3 / TICKS ** 2;
const WALK_SPEED = 3.5 / TICKS;
const RAMP_TICKS = 20 * TICKS;
const GRIP = 8 / TICKS ** 2;
const PROFILE = { walkSpeed: WALK_SPEED, rampDuration: RAMP_TICKS, grip: GRIP };
const EAST = { x: 1, y: 0 };
const WEST = { x: -1, y: 0 };
const NORTH = { x: 0, y: 1 };
const NONE = { x: 0, y: 0 };

const momentum = (): Momentum => new Momentum(PROFILE, ACCELERATION, MAX_SPEED);

/** Drives `ticks` ticks toward `heading` and returns the distance covered along x and y. */
const drive = (rule: Momentum, velocity: MutableVec2, heading: typeof EAST, ticks: number) => {
  const moved = { x: 0, y: 0 };
  for (let tick = 0; tick < ticks; tick += 1) {
    rule.drive(velocity, heading, MAX_SPEED);
    moved.x += velocity.x;
    moved.y += velocity.y;
  }
  return moved;
};

describe('Momentum', () => {
  it('reaches walk speed in about a second, then the top speed only after the ramp', () => {
    const rule = momentum();
    const velocity = { x: 0, y: 0 };

    // 35 ticks of acceleration reach walk speed; the 36th is the capped tick that lands on it.
    drive(rule, velocity, EAST, 36);
    expect(velocity.x * TICKS).toBeCloseTo(3.5);
    drive(rule, velocity, EAST, RAMP_TICKS / 2);
    expect(velocity.x * TICKS).toBeCloseTo((3.5 + 9) / 2, 1);
    drive(rule, velocity, EAST, RAMP_TICKS / 2);
    expect(velocity.x * TICKS).toBeCloseTo(9);
    drive(rule, velocity, EAST, 30);
    expect(velocity.x).toBe(MAX_SPEED);
  });

  it('slides a full reverse at top speed about 5 m to a stop in about 1.1 s, then builds up again', () => {
    const rule = momentum();
    const velocity = { x: MAX_SPEED, y: 0 };

    const slide = drive(rule, velocity, WEST, 34);

    expect(velocity.x).toBe(0);
    expect(slide.x).toBeCloseTo(81 / 16, 0);
    drive(rule, velocity, WEST, 1);
    expect(velocity.x).toBeLessThan(0);
  });

  it('slides a 90° turn at top speed sideways and comes out at walk speed', () => {
    const rule = momentum();
    const velocity = { x: MAX_SPEED, y: 0 };

    const slide = drive(rule, velocity, NORTH, 35);

    expect(velocity.x).toBe(0);
    expect(slide.x).toBeCloseTo(81 / 16, 0);
    expect(velocity.y * TICKS).toBeCloseTo(3.5);
  });

  it('keeps the part of the speed that points the new way: about 70% through a 45° turn', () => {
    const rule = momentum();
    const velocity = { x: MAX_SPEED, y: 0 };

    drive(rule, velocity, { x: Math.SQRT1_2, y: Math.SQRT1_2 }, 30);

    expect(Math.hypot(velocity.x, velocity.y) / MAX_SPEED).toBeGreaterThan(0.7);
    expect(Math.hypot(velocity.x, velocity.y) / MAX_SPEED).toBeLessThan(0.75);
    expect(velocity.x).toBeCloseTo(velocity.y);
  });

  it('coasts to a stop at grip when the unit stops steering', () => {
    const rule = momentum();
    const velocity = { x: MAX_SPEED, y: 0 };

    const coast = drive(rule, velocity, NONE, 34);

    expect(velocity).toEqual({ x: 0, y: 0 });
    expect(coast.x).toBeCloseTo(81 / 16, 0);
  });

  it('never returns more than the cap and stops at once on a zero cap', () => {
    const rule = momentum();
    const velocity = { x: MAX_SPEED, y: 0 };

    expect(rule.drive(velocity, EAST, MAX_SPEED / 2)).toBeCloseTo(MAX_SPEED / 2);
    expect(rule.drive(velocity, EAST, 0)).toBe(0);
    expect(velocity).toEqual({ x: 0, y: 0 });
  });

  it('sheds only the velocity that runs into the block', () => {
    const rule = momentum();
    const headOn = { x: MAX_SPEED, y: 0 };
    const glancing = { x: MAX_SPEED, y: MAX_SPEED };
    const away = { x: -MAX_SPEED, y: 0 };
    const rounding = { x: MAX_SPEED, y: 0 };

    expect(rule.shed(headOn, { x: 0.2, y: 0 })).toBe(0);
    expect(rule.shed(glancing, { x: 0.05, y: 0 })).toBeCloseTo(MAX_SPEED);
    expect(glancing).toEqual({ x: 0, y: MAX_SPEED });
    expect(rule.shed(away, { x: 0.2, y: 0 })).toBe(MAX_SPEED);
    expect(rule.shed(rounding, { x: 1e-9, y: 0 })).toBe(MAX_SPEED);
  });

  it('rejects a walk speed at or above the top speed, and any value that is not positive', () => {
    expect(
      () => new Momentum({ ...PROFILE, walkSpeed: MAX_SPEED }, ACCELERATION, MAX_SPEED),
    ).toThrow(/walkSpeed/);
    expect(() => new Momentum({ ...PROFILE, grip: 0 }, ACCELERATION, MAX_SPEED)).toThrow(/grip/);
    expect(
      () => new Momentum({ ...PROFILE, rampDuration: Number.NaN }, ACCELERATION, MAX_SPEED),
    ).toThrow(/rampDuration/);
  });
});
