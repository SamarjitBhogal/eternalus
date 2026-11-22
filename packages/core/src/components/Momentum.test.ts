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
const NORTHWEST = { x: -Math.SQRT1_2, y: Math.SQRT1_2 };
/** The unit normal of a wall to the east, pointing out of it (as `CollisionResolver` reports it). */
const EAST_WALL = { x: -1, y: 0 };
/** The unit normal of a wall to the north, pointing out of it. */
const NORTH_WALL = { x: 0, y: -1 };

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
 * Drives `ticks` ticks toward `heading` beside a straight wall to the east: each move that runs
 * into the wall touches it, as `CollisionSystem` reports it. Returns the speed after the last tick.
 */
const driveBesideEastWall = (
  rule: Momentum,
  velocity: MutableVec2,
  heading: typeof EAST,
  ticks: number,
) => {
  for (let tick = 0; tick < ticks; tick += 1) {
    rule.drive(velocity, heading, MAX_SPEED);
    rule.shed(velocity, velocity.x > 0 ? [EAST_WALL] : []);
  }
  return Math.hypot(velocity.x, velocity.y);
};

describe('Momentum', () => {
  it('reaches walk speed in about a second, then the top speed only after the ramp', () => {
    const rule = momentum();
    const velocity = { x: 0, y: 0 };

    // 35 ticks of acceleration reach walk speed (3.5 m/s at 3 m/s²); the ramp starts on the 36th.
    drive(rule, velocity, EAST, 35);
    expect(velocity.x * TICKS).toBeCloseTo(3.5);
    drive(rule, velocity, EAST, RAMP_TICKS / 2);
    expect(velocity.x * TICKS).toBeCloseTo((3.5 + 9) / 2, 1);
    drive(rule, velocity, EAST, RAMP_TICKS / 2);
    expect(velocity.x * TICKS).toBeCloseTo(9);
    drive(rule, velocity, EAST, 30);
    expect(velocity.x).toBe(MAX_SPEED);
  });

  it('reaches the top speed on every heading, though roundoff reads a diagonal a hair below walk speed', () => {
    const stalled: number[] = [];
    for (let degrees = 0; degrees < 360; degrees += 1) {
      const rule = momentum();
      const velocity = { x: 0, y: 0 };
      const heading = { x: cos((degrees * Math.PI) / 180), y: sin((degrees * Math.PI) / 180) };
      drive(rule, velocity, heading, 35 + RAMP_TICKS + TICKS);
      if (Math.hypot(velocity.x, velocity.y) * TICKS < 8.99) stalled.push(degrees);
    }

    expect(stalled).toEqual([]);
  });

  it('reaches the top speed along a wall it steers a hair into, at every wall angle', () => {
    const stalled: string[] = [];
    for (let wallDegrees = 0; wallDegrees < 360; wallDegrees += 1) {
      const wallAngle = (wallDegrees * Math.PI) / 180;
      const wall = { x: cos(wallAngle), y: sin(wallAngle) };
      for (const degrees of [0.01, 1]) {
        const rule = momentum();
        const velocity = { x: 0, y: 0 };
        const angle = (degrees * Math.PI) / 180;
        // Along the wall (-wall.y, wall.x), turned `degrees` into it (-wall).
        const heading = {
          x: -wall.y * cos(angle) - wall.x * sin(angle),
          y: wall.x * cos(angle) - wall.y * sin(angle),
        };
        for (let tick = 0; tick < 35 + RAMP_TICKS + TICKS; tick += 1) {
          rule.drive(velocity, heading, MAX_SPEED);
          rule.shed(velocity, velocity.x * wall.x + velocity.y * wall.y < 0 ? [wall] : []);
        }
        const speed = Math.hypot(velocity.x, velocity.y) * TICKS;
        if (Math.abs(speed - 9 * cos(angle)) > 0.01)
          stalled.push(`${String(wallDegrees)}/${String(degrees)}`);
      }
    }

    expect(stalled).toEqual([]);
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
    const along = { x: 0, y: MAX_SPEED };
    const intoCorner = { x: MAX_SPEED / 2, y: MAX_SPEED };

    expect(rule.shed(headOn, [EAST_WALL])).toBe(0);
    expect(rule.shed(glancing, [EAST_WALL])).toBeCloseTo(MAX_SPEED);
    expect(glancing).toEqual({ x: 0, y: MAX_SPEED });
    expect(rule.shed(away, [EAST_WALL])).toBe(MAX_SPEED);
    // A wall it runs along takes nothing, so it does not tilt the run off the wall.
    expect(rule.shed(along, [EAST_WALL])).toBe(MAX_SPEED);
    expect(along).toEqual({ x: 0, y: MAX_SPEED });
    // In a corner, each wall takes its own part: nothing is left.
    expect(rule.shed(intoCorner, [EAST_WALL, NORTH_WALL])).toBe(0);
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
    rule.shed(velocity, [EAST_WALL]);

    expect(driveBesideEastWall(rule, velocity, steep, 1) * TICKS).toBeCloseTo(9 - 8 / TICKS, 2);
    expect(driveBesideEastWall(rule, velocity, steep, TICKS)).toBeCloseTo(MAX_SPEED * steep.y, 9);
  });

  it('stays stopped against a wall it steers straight into', () => {
    const velocity = { x: 0, y: 0 };

    expect(driveBesideEastWall(momentum(), velocity, EAST, TICKS)).toBe(0);
  });

  it('stays stopped in a corner it steers into, and keeps pressing along its heading', () => {
    const rule = momentum();
    const velocity = { x: 0, y: 0 };
    // Mostly north, so it points into both walls but not at the corner's middle.
    const heading = intoEastWall(30);

    for (let tick = 0; tick < TICKS; tick += 1) {
      rule.drive(velocity, heading, MAX_SPEED);
      // The move it tries (what `MovementSystem` faces) is along the heading, every tick.
      expect(velocity.x * heading.y - velocity.y * heading.x).toBeCloseTo(0, 12);
      expect(rule.shed(velocity, [EAST_WALL, NORTH_WALL])).toBe(0);
    }
  });

  it('stays stopped in a corner wider than 90° that it steers into, as in a square one', () => {
    const rule = momentum();
    const velocity = { x: 0, y: 0 };
    // The east wall meets a wall that runs north-west from it: a 135° corner. The heading points
    // into both walls, but not at the corner's middle.
    const northWestWall = { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };
    const heading = intoEastWall(60);

    for (let tick = 0; tick < TICKS; tick += 1) {
      rule.drive(velocity, heading, MAX_SPEED);
      // Sliding off one wall and then the other leaves a part along the second wall, out of the
      // corner, so the unit would flip between the walls every tick.
      expect(velocity.x * heading.y - velocity.y * heading.x).toBeCloseTo(0, 12);
      expect(rule.shed(velocity, [EAST_WALL, northWestWall])).toBe(0);
    }
  });

  it('builds along a slanted wall from rest, though roundoff puts it a hair against the build', () => {
    const rule = momentum();
    const slantedWall = { x: -0.96, y: -0.28 };
    // East slides off this wall along (0.28, -0.96), and the slide rounds 1e-17 into the wall;
    // `shed` leaves 1e-18 of speed against the slide.
    const velocity = { x: -0.28e-18, y: 0.96e-18 };
    rule.shed(velocity, [slantedWall]);

    rule.drive(velocity, EAST, MAX_SPEED);

    expect(velocity.x * 0.28 - velocity.y * 0.96).toBeCloseTo(ACCELERATION, 12);
  });

  it('forgets the wall once a move hits nothing, and ignores a wall it steers away from', () => {
    const steered = momentum();
    const velocity = { x: 0, y: MAX_SPEED };
    steered.shed(velocity, [EAST_WALL]);
    steered.drive(velocity, NORTHEAST, MAX_SPEED);
    const fresh = { ...velocity };
    const away = momentum();
    const awayVelocity = { ...velocity };
    away.shed(awayVelocity, [EAST_WALL]);
    const freshAway = { ...awayVelocity };

    steered.drive(velocity, NORTHEAST, MAX_SPEED);
    momentum().drive(fresh, NORTHEAST, MAX_SPEED);
    away.drive(awayVelocity, NORTHWEST, MAX_SPEED);
    momentum().drive(freshAway, NORTHWEST, MAX_SPEED);

    expect(velocity).toEqual(fresh);
    expect(awayVelocity).toEqual(freshAway);
  });

  it('keeps the walls the last move touched until the next drive, or until it forgets them', () => {
    const rule = momentum();
    rule.shed({ x: 0, y: 0 }, [EAST_WALL, NORTH_WALL]);

    expect(rule.wallNormals).toEqual([EAST_WALL, NORTH_WALL]);
    rule.forgetWalls();
    expect(rule.wallNormals).toEqual([]);
    rule.shed({ x: 0, y: 0 }, [EAST_WALL]);
    rule.drive({ x: 0, y: 0 }, NORTHEAST, MAX_SPEED);
    expect(rule.wallNormals).toEqual([]);
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
