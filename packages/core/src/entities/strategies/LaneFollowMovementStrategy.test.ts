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

const NORTH_EAST = { x: 0.6, y: -0.8 };

/** A lane field leading along `direction` everywhere, with a wall wherever `isBlocked` says. */
const fieldWithWall = (
  direction: { x: number; y: number },
  isBlocked: (fromX: number, fromY: number, toX: number, toY: number) => boolean,
) => ({
  isLineClear: (fromX: number, fromY: number, toX: number, toY: number) =>
    !isBlocked(fromX, fromY, toX, toY),
  directionAt: (_x: number, _y: number, out: { x: number; y: number }) => {
    out.x = direction.x;
    out.y = direction.y;
    return true;
  },
});

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

  it('follows the flow field while the line to the slot is blocked, and only then', () => {
    // Blocked only eastward (toward the slot at +x); the field's own direction (+y) is open.
    const blockedAhead = (isClear: boolean) => ({
      isLineClear: (fromX: number, _y: number, toX: number) => isClear || toX <= fromX,
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
    // Where the field has no direction the blocked mob holds rather than walk onto blocked ground.
    expect(strategy.desiredVelocity(0, unrouted)).toEqual({ x: 0, y: 0 });
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

  it('never lets separation push a held mob onto blocked ground', () => {
    // Blocked eastward only. The chaser at (10, 10) holds; a neighbour one unit behind it pushes it
    // east, onto the blocked ground, so it must still hold. Pushed west, onto open ground, it moves.
    const eastBlocked = {
      isLineClear: (fromX: number, _y: number, toX: number) => toX <= fromX,
      directionAt: () => false,
    };
    const behind = {
      ...contextOf(
        [
          [10, 10],
          [9, 10],
        ],
        { x: 40, y: 10 },
      ),
      isChasing: true,
      flow: eastBlocked,
    };
    const ahead = {
      ...contextOf(
        [
          [10, 10],
          [11, 10],
        ],
        { x: 40, y: 10 },
      ),
      isChasing: true,
      flow: eastBlocked,
    };

    expect(strategy.desiredVelocity(0, behind)).toEqual({ x: 0, y: 0 });
    expect(strategy.desiredVelocity(0, ahead).x).toBeLessThan(0);
  });

  it('turns a heading that meets a wall along it, larger open axis first, chase or march', () => {
    // The field leads north-east from (10, 10) and the slot is out of sight, so the march is routed.
    const eastWall = fieldWithWall(NORTH_EAST, (fromX, _fromY, toX) => toX > fromX + 1);
    const northWall = fieldWithWall(NORTH_EAST, (_fromX, fromY, _toX, toY) => toY < fromY - 1);
    // Only the corner ahead is blocked, so both axes are open and the larger one wins.
    const corner = fieldWithWall(
      NORTH_EAST,
      (fromX, fromY, toX, toY) => toX > fromX + 1 && toY < fromY - 1,
    );
    const march = contextOf([[10, 10]], { x: 40, y: -20 });
    // A chase north with a clear line, until a neighbour just west of it pushes the heading east,
    // into the wall: it turns back north, along the wall, rather than hold.
    const chase = {
      ...contextOf(
        [
          [10, 10],
          [9.3, 10],
        ],
        { x: 10, y: 4 },
      ),
      isChasing: true,
      arrivalRadius: 1,
      flow: eastWall,
    };

    expect(strategy.desiredVelocity(0, { ...march, flow: eastWall })).toEqual({ x: 0, y: -0.8 });
    expect(strategy.desiredVelocity(0, { ...march, flow: northWall })).toEqual({ x: 0.6, y: 0 });
    expect(strategy.desiredVelocity(0, { ...march, flow: corner })).toEqual({ x: 0, y: -0.8 });
    expect(strategy.desiredVelocity(0, chase)).toEqual({ x: 0, y: -1 });
  });

  it('keeps a march going where no axis is open, or the open one is under minSteer', () => {
    // Holding the march would strand it there for good; the wall cells' field leads it back out
    // (architecture 10 §9). East of a steep heading is open, but too weak to turn to.
    const steep = { x: 0.2, y: -0.98 };
    const march = contextOf([[10, 10]], { x: 40, y: -20 });
    const walled = { ...march, flow: fieldWithWall(NORTH_EAST, () => true) };
    const northWall = {
      ...march,
      flow: fieldWithWall(steep, (_fromX, fromY, _toX, toY) => toY < fromY - 1),
    };

    expect(strategy.desiredVelocity(0, walled)).toEqual(NORTH_EAST);
    expect(strategy.desiredVelocity(0, northWall)).toEqual(steep);
  });

  it('closes on a target in front of blocked ground, checking no farther than the target', () => {
    // Ground from x 50 on is blocked. The chaser at x 46 has a clear line to its target at x 49,
    // outside attack reach, so it must keep closing even though x 50 is within the look-ahead.
    const blockedFrom50 = {
      isLineClear: (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        maxDistance: number,
      ) => {
        const span = Math.hypot(toX - fromX, toY - fromY);
        const reach = Math.min(span, maxDistance);
        return span === 0 || fromX + ((toX - fromX) * reach) / span < 50;
      },
      directionAt: () => false,
    };
    const chase = {
      ...contextOf([[46, 10]], { x: 49, y: 10 }),
      isChasing: true,
      arrivalRadius: 2.3,
      flow: blockedFrom50,
    };

    expect(strategy.desiredVelocity(0, chase)).toEqual({ x: 1, y: 0 });
  });
});
