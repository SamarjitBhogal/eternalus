import { describe, expect, it } from 'vitest';

import { Momentum } from './Momentum';
import { cos, sin } from '../utils/deterministicMath';
import type { MutableVec2 } from '../utils/vec2.types';

// Example numbers: the Sentinel's (content/legends/sentinel.ts) at the time of writing, loaded at
// 30 ticks per second.
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
const NORTHEAST = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
/**
 * A loss the resolver can leave when a unit runs north almost along a wall to the east: about
 * 1e-6 m into the wall, tilted by its back-off (up to `CONTACT_EPSILON` along the move). It is not
 * a block (`BLOCK_EPSILON`); read as one, it would push the unit off the wall at about 1 m/s.
 */
const BACK_OFF = { x: 9e-7, y: 1e-7 };

/** A unit vector `degrees` into a wall to the east (normal `EAST`) from running north along it. */
const intoEastWall = (degrees: number) => ({
  x: sin((degrees * Math.PI) / 180),
  y: cos((degrees * Math.PI) / 180),
});

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

/**
 * Drives `ticks` ticks toward `heading` beside a straight wall to the east: each tick's move loses
 * its part into the wall, as `CollisionSystem` reports it. Returns the speed after the last tick.
 */
const driveBesideEastWall = (
  rule: Momentum,
  velocity: MutableVec2,
  heading: typeof EAST,
  ticks: number,
) => {
  for (let tick = 0; tick < ticks; tick += 1) {
    rule.drive(velocity, heading, MAX_SPEED);
    rule.shed(velocity, { x: Math.max(0, velocity.x), y: 0 });
  }
  return Math.hypot(velocity.x, velocity.y);
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

    drive(rule, velocity, NORTHEAST, 30);

    expect(Math.hypot(velocity.x, velocity.y) / MAX_SPEED).toBeGreaterThan(0.7);
    expect(Math.hypot(velocity.x, velocity.y) / MAX_SPEED).toBeLessThan(0.75);
    expect(velocity.x).toBeCloseTo(velocity.y);
  });

  it('has no jump at 90°: a turn just past it comes out nearly as fast, a sharper one slower', () => {
    const speedAfter40Ticks = (degrees: number) => {
      const rule = momentum();
      const velocity = { x: MAX_SPEED, y: 0 };
      const radians = (degrees * Math.PI) / 180;
      drive(rule, velocity, { x: cos(radians), y: sin(radians) }, 40);
      return Math.hypot(velocity.x, velocity.y) * TICKS;
    };

    expect(speedAfter40Ticks(89)).toBeCloseTo(speedAfter40Ticks(90), 1);
    expect(speedAfter40Ticks(91)).toBeCloseTo(speedAfter40Ticks(90), 1);
    // Both parts brake at grip for 9·cos 45° / 8 s (about 24 ticks), then 16 ticks build 1.6 m/s.
    expect(speedAfter40Ticks(135)).toBeCloseTo(1.6, 1);
    // 34 ticks slide to a stop, then 6 ticks build 0.6 m/s.
    expect(speedAfter40Ticks(180)).toBeCloseTo(0.6, 1);
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
    const backOff = { x: 0, y: MAX_SPEED };

    expect(rule.shed(headOn, { x: 0.2, y: 0 })).toBe(0);
    expect(rule.shed(glancing, { x: 0.05, y: 0 })).toBeCloseTo(MAX_SPEED);
    expect(glancing).toEqual({ x: 0, y: MAX_SPEED });
    expect(rule.shed(away, { x: 0.2, y: 0 })).toBe(MAX_SPEED);
    expect(rule.shed(backOff, BACK_OFF)).toBe(MAX_SPEED);
    expect(backOff).toEqual({ x: 0, y: MAX_SPEED });
  });

  it('builds along a wall it steers 45° into from a standstill, past walk speed in 2 s', () => {
    const velocity = { x: 0, y: 0 };

    const speed = driveBesideEastWall(momentum(), velocity, NORTHEAST, 2 * TICKS);

    expect(speed * TICKS).toBeGreaterThan(3.5);
    expect(velocity.x).toBeCloseTo(0, 9);
  });

  it('keeps a run along a wall at top speed times the cosine of the angle it steers into it', () => {
    const velocity = { x: 0, y: MAX_SPEED };
    const shallow = intoEastWall(5);

    expect(driveBesideEastWall(momentum(), velocity, shallow, 3 * TICKS)).toBeCloseTo(
      MAX_SPEED * shallow.y,
      9,
    );
  });

  it('slides down to that slower top speed at grip, not at once, when it turns further in', () => {
    const rule = momentum();
    const velocity = { x: 0, y: MAX_SPEED };
    const steep = intoEastWall(30);
    rule.shed(velocity, { x: 0.01, y: 0 });

    expect(driveBesideEastWall(rule, velocity, steep, 1) * TICKS).toBeCloseTo(9 - 8 / TICKS, 2);
    expect(driveBesideEastWall(rule, velocity, steep, TICKS)).toBeCloseTo(MAX_SPEED * steep.y, 9);
  });

  it('stays stopped against a wall it steers straight into', () => {
    const velocity = { x: 0, y: 0 };

    expect(driveBesideEastWall(momentum(), velocity, EAST, TICKS)).toBe(0);
  });

  it('forgets the wall once a move hits nothing, and keeps none for a back-off loss', () => {
    const steered = momentum();
    const velocity = { x: 0, y: MAX_SPEED };
    steered.shed(velocity, { x: 0.01, y: 0 });
    steered.drive(velocity, NORTHEAST, MAX_SPEED);
    const backedOff = momentum();
    const backedOffVelocity = { ...velocity };
    backedOff.shed(backedOffVelocity, BACK_OFF);
    const fresh = { ...velocity };

    steered.drive(velocity, NORTHEAST, MAX_SPEED);
    backedOff.drive(backedOffVelocity, NORTHEAST, MAX_SPEED);
    momentum().drive(fresh, NORTHEAST, MAX_SPEED);

    expect(velocity).toEqual(fresh);
    expect(backedOffVelocity).toEqual(fresh);
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
