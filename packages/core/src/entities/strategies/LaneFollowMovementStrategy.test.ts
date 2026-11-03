import { describe, expect, it } from 'vitest';

import { HORDE_STEERING } from '../../content/ai/hordeSteering';
import { LaneFollowMovementStrategy } from './LaneFollowMovementStrategy';
import { contextOf } from './__fixtures__/laneFollowContext';

const strategy = new LaneFollowMovementStrategy(HORDE_STEERING);

describe('LaneFollowMovementStrategy', () => {
  it('steers toward the slot, and not at all once there, writing into context.out', () => {
    const toward = contextOf([[10, 10]], { x: 40, y: 10 });
    const there = contextOf([[10, 10]], { x: 10 + HORDE_STEERING.slotArrivalRadius / 2, y: 10 });

    const steer = strategy.desiredVelocity(0, toward);

    expect(steer).toBe(toward.out);
    expect(steer).toEqual({ x: 1, y: 0 });
    expect(strategy.desiredVelocity(0, there)).toEqual({ x: 0, y: 0 });
  });

  it('pushes away from any neighbour, even on the slot', () => {
    const context = contextOf(
      [
        [10, 10],
        [10.5, 10],
      ],
      { x: 10, y: 10 },
    );

    const steer = strategy.desiredVelocity(0, context);

    expect(steer.x).toBeLessThan(0);
    expect(steer.y).toBe(0);
  });

  it('weights the push 1/r, shifted to reach 0 at the separation radius (10 §9)', () => {
    const { separationRadius: radius, separationWeight: weight } = HORDE_STEERING;
    const pushAt = (apart: number) =>
      strategy.desiredVelocity(
        0,
        contextOf(
          [
            [10, 10],
            [10 + apart, 10],
          ],
          { x: 10, y: 10 },
        ),
      ).x;

    // weight × (radius / apart − 1): the weight at half the radius, three times it at a quarter.
    expect(pushAt(radius / 2)).toBeCloseTo(-weight);
    expect(pushAt(radius / 4)).toBeCloseTo(-3 * weight);
  });

  it('drops a steer shorter than minSteer, so a settled horde stands still', () => {
    // Just inside the separation radius: a push far below minSteer.
    const context = contextOf(
      [
        [10, 10],
        [10 + HORDE_STEERING.separationRadius - 0.01, 10],
      ],
      { x: 10, y: 10 },
    );

    expect(strategy.desiredVelocity(0, context)).toEqual({ x: 0, y: 0 });
  });

  it('stops at the context’s arrival radius, such as attack reach while chasing', () => {
    const context = { ...contextOf([[0, 0]], { x: 2, y: 0 }), arrivalRadius: 2.5 };

    expect(strategy.desiredVelocity(0, context)).toEqual({ x: 0, y: 0 });
    expect(strategy.desiredVelocity(0, { ...context, arrivalRadius: 1 })).toEqual({ x: 1, y: 0 });
  });
});
