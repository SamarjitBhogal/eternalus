import { describe, expect, it } from 'vitest';

import { HORDE_STEERING } from '../../content/ai/hordeSteering';
import { SpatialHash } from '../../physics/SpatialHash';
import { LaneFollowMovementStrategy } from './LaneFollowMovementStrategy';
import type { MovementContext } from './MovementStrategy.types';

/** A context with units at `points`, heading for `target`. */
const contextOf = (points: readonly [number, number][], target: { x: number; y: number }) => {
  const positions = Float64Array.from(points.flatMap(([x, y]) => [x, y]));
  const neighbours = new SpatialHash(100, 100, HORDE_STEERING.separationRadius);
  neighbours.rebuild(positions, points.length);
  return {
    positions,
    neighbours,
    found: new Int32Array(points.length),
    target,
    arrivalRadius: HORDE_STEERING.slotArrivalRadius,
    isChasing: false,
    out: { x: 0, y: 0 },
    flow: null,
  } satisfies MovementContext;
};

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

  it('follows the flow field while the line to the slot is blocked, and only then', () => {
    const blockedAhead = (isClear: boolean) => ({
      isLineClear: (_x: number, _y: number, _tx: number, _ty: number, maxDistance: number) =>
        isClear || maxDistance !== HORDE_STEERING.blockedLookAhead,
      directionAt: (_x: number, _y: number, out: { x: number; y: number }) => {
        out.x = 0;
        out.y = 1;
        return true;
      },
    });
    const noField = {
      isLineClear: () => false,
      directionAt: () => false,
    };

    const routed = { ...contextOf([[10, 10]], { x: 40, y: 10 }), flow: blockedAhead(false) };
    const clear = { ...contextOf([[10, 10]], { x: 40, y: 10 }), flow: blockedAhead(true) };
    const unrouted = { ...contextOf([[10, 10]], { x: 40, y: 10 }), flow: noField };

    expect(strategy.desiredVelocity(0, routed)).toEqual({ x: 0, y: 1 });
    expect(strategy.desiredVelocity(0, clear)).toEqual({ x: 1, y: 0 });
    // Where the field has no direction the mob still heads for its slot.
    expect(strategy.desiredVelocity(0, unrouted)).toEqual({ x: 1, y: 0 });
  });

  it('holds a chase where the line to its target is blocked, and never follows the lane field', () => {
    const towardLane = {
      isLineClear: (_x: number, _y: number, _tx: number, _ty: number, maxDistance: number) =>
        maxDistance !== HORDE_STEERING.blockedLookAhead,
      directionAt: (_x: number, _y: number, out: { x: number; y: number }) => {
        out.x = 0;
        out.y = 1;
        return true;
      },
    };
    const clearAhead = { ...towardLane, isLineClear: () => true };
    const chase = { ...contextOf([[10, 10]], { x: 40, y: 10 }), isChasing: true };

    expect(strategy.desiredVelocity(0, { ...chase, flow: towardLane })).toEqual({ x: 0, y: 0 });
    expect(strategy.desiredVelocity(0, { ...chase, flow: clearAhead })).toEqual({ x: 1, y: 0 });
  });
});
