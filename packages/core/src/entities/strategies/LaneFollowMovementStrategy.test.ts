import { describe, expect, it } from 'vitest';

import { HORDE_STEERING } from '../../content/ai/hordeSteering';
import { SpatialHash } from '../../physics/SpatialHash';
import { LaneFollowMovementStrategy } from './LaneFollowMovementStrategy';
import type { Crowd } from './LaneFollowMovementStrategy.types';

/** A crowd of units at `points`. */
const crowdOf = (points: readonly [number, number][]): Crowd => {
  const hash = new SpatialHash(100, 100, HORDE_STEERING.separationRadius);
  const crowd = {
    hash,
    xs: Float64Array.from(points.map(([x]) => x)),
    ys: Float64Array.from(points.map(([, y]) => y)),
  };
  points.forEach(([x, y], index) => {
    hash.insert(index, x, y);
  });
  return crowd;
};

const strategy = new LaneFollowMovementStrategy(HORDE_STEERING);

describe('LaneFollowMovementStrategy', () => {
  it('steers toward the slot, and not at all once there', () => {
    const out = { x: 0, y: 0 };
    const crowd = crowdOf([[10, 10]]);

    strategy.steer(out, crowd, 0, { x: 40, y: 10 });
    expect(out).toEqual({ x: 1, y: 0 });

    strategy.steer(out, crowd, 0, { x: 10 + HORDE_STEERING.slotArrivalRadius / 2, y: 10 });
    expect(out).toEqual({ x: 0, y: 0 });
  });

  it('pushes away from any neighbour, whatever its team, even on the slot', () => {
    const out = { x: 0, y: 0 };
    const crowd = crowdOf([
      [10, 10],
      [10.5, 10],
    ]);

    strategy.steer(out, crowd, 0, { x: 10, y: 10 });

    expect(out.x).toBeLessThan(0);
    expect(out.y).toBe(0);
  });

  it('drops a steer shorter than minSteer, so a settled horde stands still', () => {
    const out = { x: 0, y: 0 };
    // Just inside the separation radius: a push far below minSteer.
    const crowd = crowdOf([
      [10, 10],
      [10 + HORDE_STEERING.separationRadius - 0.01, 10],
    ]);

    strategy.steer(out, crowd, 0, { x: 10, y: 10 });

    expect(out).toEqual({ x: 0, y: 0 });
    expect(strategy.neighbourRadius).toBe(HORDE_STEERING.separationRadius);
  });
});
