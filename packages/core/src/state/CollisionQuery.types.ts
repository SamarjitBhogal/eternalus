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

  /**
   * Where a circle of `radius` at `at` stands once pushed out of the walls it overlaps, each time
   * the shortest way out of the deepest one, never into another wall, and kept inside the map's
   * edge: `at` itself when it overlaps none. A unit a new wall was placed over is moved here
   * (`EntitySummoner`), and a body that grows in place is moved here when the result has room
   * (`BodySizeSystem`, `hasRoom`), so they keep the precondition of `reach`. The push does not
   * search for free ground: it can end with the circle partly inside a wall it already overlapped
   * (`CollisionResolver.pushOut` gives the limits).
   */
  pushOut(at: Vec2, radius: number): Vec2;

  /**
   * Whether a circle of `radius` at `at` overlaps no wall, by the test `pushOut` moves a circle
   * with. `BodySizeSystem` asks it before a body grows.
   */
  hasRoom(at: Vec2, radius: number): boolean;
}
