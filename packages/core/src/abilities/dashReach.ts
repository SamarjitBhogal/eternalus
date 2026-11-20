import type { CollisionQuery } from '../state/CollisionQuery.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * How far along `direction` (a unit vector) from `from` a dash of a caster of `radius` may go, up
 * to `distance` metres: to where the caster's circle first touches a wall or the map's edge, as the
 * match's collision rule (`GameState.collisions`, the one `CollisionSystem` walks units with) stops
 * walking there (architecture 10 §7). All of `distance` with no collision rule (no map objects),
 * since nothing then stops walking either. The one rule `DashEffect` casts with and
 * `Simulation.dashReach` previews with, so an aim overlay never promises a dash through a wall.
 */
export function dashReach(
  collisions: CollisionQuery | null,
  from: Vec2,
  direction: Vec2,
  distance: number,
  radius: number,
): number {
  return collisions === null ? distance : collisions.reach(from, direction, distance, radius);
}
