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
});
