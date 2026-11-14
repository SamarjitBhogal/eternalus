import type { MatchWorld } from '../state/MatchWorld';
import type { Vec2 } from '../utils/geometry.types';

/**
 * How far along `direction` (a unit vector) from `from` a dash of a caster of `radius` may go, up
 * to `distance` metres: to where the caster's circle first touches a wall (the match world's
 * collision sweep, the one `CollisionSystem` moves units with) or the map's edge, as walking
 * stops there (architecture 10 §7). All of `distance` with no map or no collision sweep, since
 * nothing then stops walking either. The one rule `DashEffect` casts with and
 * `Simulation.dashReach` previews with, so an aim overlay never promises a dash through a wall.
 */
export function dashReach(
  world: Pick<MatchWorld, 'definition' | 'collisions'> | null,
  from: Vec2,
  direction: Vec2,
  distance: number,
  radius: number,
): number {
  const collisions = world?.collisions ?? null;
  if (world === null || collisions === null) {
    return distance;
  }
  const { width, height } = world.definition;
  const reach = Math.min(
    distance,
    toEdge(from.x, direction.x, radius, width),
    toEdge(from.y, direction.y, radius, height),
  );
  const displacement = { x: direction.x * reach, y: direction.y * reach };
  return reach * collisions.travel(from, displacement, radius);
}

/**
 * How far a circle of `radius` at `at` on one axis moves at `step` per metre before it leaves
 * [`radius`, `size` - `radius`], as `CollisionSystem` clamps a unit; infinite when it does not move
 * along the axis.
 */
function toEdge(at: number, step: number, radius: number, size: number): number {
  if (step === 0) return Number.POSITIVE_INFINITY;
  const edge = step > 0 ? size - radius : radius;
  return Math.max(0, (edge - at) / step);
}
