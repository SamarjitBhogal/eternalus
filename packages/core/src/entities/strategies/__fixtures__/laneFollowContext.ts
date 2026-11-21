import { HORDE_STEERING } from '../../../content/ai/hordeSteering';
import { SpatialHash } from '../../../physics/SpatialHash';
import type { MovementContext } from '../MovementStrategy.types';

/** A context with units at `points`, heading for `target`. */
export const contextOf = (
  points: readonly [number, number][],
  target: { x: number; y: number },
) => {
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
