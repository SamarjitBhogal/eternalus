import { describe, expect, it } from 'vitest';

import { Movement } from './Movement';

const STATS = { maxSpeed: 3, acceleration: 1, mass: 2 };

describe('Movement', () => {
  it('starts stopped', () => {
    const movement = new Movement(STATS);

    expect(movement.speed).toBe(0);
    expect(movement.velocity).toEqual({ x: 0, y: 0 });
  });

  it('reaches maxSpeed after maxSpeed / acceleration ticks and never exceeds it', () => {
    const movement = new Movement(STATS);

    for (let tick = 0; tick < 3; tick += 1) {
      movement.accelerateToward({ x: 1, y: 0 });
    }
    expect(movement.speed).toBe(3);

    movement.accelerateToward({ x: 1, y: 0 });
    expect(movement.speed).toBe(3);
    expect(movement.velocity).toEqual({ x: 3, y: 0 });
  });

  it('points the velocity along the direction whatever its length', () => {
    const movement = new Movement(STATS);

    movement.accelerateToward({ x: 0, y: -10 });
    expect(movement.velocity).toEqual({ x: 0, y: -1 });
  });

  it('stops on a zero direction or stop()', () => {
    const movement = new Movement(STATS);
    movement.accelerateToward({ x: 1, y: 1 });

    movement.accelerateToward({ x: 0, y: 0 });
    expect(movement.speed).toBe(0);

    movement.accelerateToward({ x: 1, y: 1 });
    movement.stop();
    expect(movement.velocity).toEqual({ x: 0, y: 0 });
  });

  it('rejects stats that are not positive', () => {
    expect(() => new Movement({ ...STATS, mass: 0 })).toThrow('mass must be a positive number');
    expect(() => new Movement({ ...STATS, maxSpeed: -1 })).toThrow('maxSpeed');
  });

  it('steers toward a normalised heading and advances one tick at a time', () => {
    const movement = new Movement(STATS);

    movement.steer({ x: 0, y: 10 });
    expect(movement.heading).toEqual({ x: 0, y: 1 });

    movement.advance();
    movement.advance();
    expect(movement.speed).toBe(2);
    expect(movement.velocity).toEqual({ x: 0, y: 2 });
  });

  it('slows down by one tick of acceleration when the heading is zero, then rests', () => {
    const movement = new Movement(STATS);
    movement.steer({ x: 1, y: 0 });
    movement.advance();
    movement.advance();
    movement.advance();

    movement.steer({ x: 0, y: 0 });
    movement.advance();
    expect(movement.speed).toBe(2);
    expect(movement.velocity).toEqual({ x: 2, y: 0 });

    movement.advance();
    movement.advance();
    movement.advance();
    expect(movement.speed).toBe(0);
    expect(movement.velocity).toEqual({ x: 0, y: 0 });
  });

  it('drops the heading on stop and rejects a non-finite direction', () => {
    const movement = new Movement(STATS);
    movement.steer({ x: 1, y: 1 });

    movement.stop();
    expect(movement.heading).toEqual({ x: 0, y: 0 });
    expect(() => {
      movement.steer({ x: Number.NaN, y: 0 });
    }).toThrow('Movement direction must be finite');
  });

  it('updates velocity in place instead of allocating a new vector each tick', () => {
    const movement = new Movement(STATS);
    const velocity = movement.velocity;
    movement.steer({ x: 1, y: 0 });

    movement.advance();

    expect(movement.velocity).toBe(velocity);
  });
  it('keeps the movement strategy its definition selects', () => {
    expect(new Movement(STATS, 'lane-follow').strategyId).toBe('lane-follow');
    expect(new Movement(STATS).strategyId).toBeUndefined();
  });
});
