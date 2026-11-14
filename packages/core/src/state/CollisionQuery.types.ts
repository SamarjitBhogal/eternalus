import type { Vec2 } from '../utils/geometry.types';

/**
 * The match's collision rule on the state (architecture 10 §7), beside `space` and `paths`:
 * `physics/CollisionResolver`, the one resolver `CollisionSystem` also walks units with, on the one
 * static index from which a destroyed object leaves the moment it is removed, so walls, a broken
 * object and the world's edge stop a dash and walking alike. A port because `abilities/` may not
 * import `physics/`; a dash is cut with it (`abilities/dashReach.ts`).
 */
export interface CollisionQuery {
  /**
   * How far, up to `distance` metres, a circle of `radius` moves from `from` along `direction` (a
   * unit vector) in a straight line before it first touches a wall or the map's edge, kept as far
   * short of a wall as `CollisionSystem` keeps a walking unit; the whole `distance` when nothing is
   * in the way.
   *
   * Precondition: the circle at `from` overlaps no wall, as `CollisionSystem` keeps every unit. A
   * circle that starts inside a wall is not stopped by that wall (`CollisionResolver`'s
   * `ponytail` remark).
   */
  reach(from: Vec2, direction: Vec2, distance: number, radius: number): number;
}
