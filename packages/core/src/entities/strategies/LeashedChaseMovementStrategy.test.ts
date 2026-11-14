import { describe, expect, it } from 'vitest';

import type { MovementContext } from './MovementStrategy.types';
import { LeashedChaseMovementStrategy } from './LeashedChaseMovementStrategy';

const PROFILE = { separationRadius: 1.8, separationWeight: 1.5, minSteer: 0.25 };

/** Units at `points`; unit 0 steers toward `target`, never with a flow field. */
const contextOf = (points: readonly [number, number][], target: { x: number; y: number }) => {
  const positions = new Float64Array(points.flat());
  const context: MovementContext = {
    positions,
    neighbours: {
      queryCircle: (x, y, radius, out) => {
        let count = 0;
        points.forEach(([px, py], index) => {
          if (Math.hypot(px - x, py - y) <= radius) {
            out[count] = index;
            count += 1;
          }
        });
        return count;
      },
    },
    found: new Int32Array(points.length),
    target,
    flow: null,
    arrivalRadius: 0.5,
    isChasing: false,
    out: { x: 0, y: 0 },
  };
  return context;
};

describe('LeashedChaseMovementStrategy', () => {
  const strategy = new LeashedChaseMovementStrategy(PROFILE);

  it('heads straight for its target and stops once there', () => {
    expect(strategy.desiredVelocity(0, contextOf([[0, 0]], { x: 10, y: 0 }))).toEqual({
      x: 1,
      y: 0,
    });
    expect(strategy.desiredVelocity(0, contextOf([[0, 0]], { x: 0.2, y: 0 }))).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('is pushed away from a neighbour while standing at its target', () => {
    const velocity = strategy.desiredVelocity(
      0,
      contextOf(
        [
          [0, 0],
          [0.5, 0],
        ],
        { x: 0, y: 0 },
      ),
    );

    expect(velocity.x).toBeLessThan(0);
    expect(velocity.y).toBe(0);
  });
});
