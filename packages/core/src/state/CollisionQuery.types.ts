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
   * Precondition: the circle at `from` overlaps no wall, except a shape whose blocking area holds
   * `launch`, as `CollisionSystem` keeps every unit. A circle that starts inside a wall is not
   * stopped by that wall (`CollisionResolver`'s `ponytail` remark).
   *
   * @param launch - A shot's launch point (the launch-shape rule, DEC-334): a shape whose blocking
   *   area (inside its polygon or on its edge, inside none of its passages) holds it does not stop
   *   the sweep, so a shot launched inside a wall turret's pylon and wall can leave them, also
   *   where the turret stands on the joint of two wall pieces. Omitted for a mover.
   *   A shot also flies over low ground (a lake, a lava river: `MapObjectFlags.isLowGround`,
   *   HC-Q89, DEC-345); a mover or a dash does not.
   */
  reach(from: Vec2, direction: Vec2, distance: number, radius: number, launch?: Vec2): number;

  /**
   * Whether a circle of `radius` that moves `delta` from `from` touches fire, or starts in it: a
   * shape flagged `isFire` (a lava river). A bridge deck over it is not fire, so a move along the
   * deck does not touch it. Read-only. A shot that touches fire catches fire if its definition
   * allows it (`ProjectileSystem`).
   */
  touchesFire(from: Vec2, delta: Vec2, radius: number): boolean;
}
