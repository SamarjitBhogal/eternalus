import type { Vec2 } from '../utils/geometry.types';

/**
 * The match's static collision sweep on the state (architecture 10 §7): `physics/CollisionResolver`
 * on the one `StaticCollisionIndex` that `CollisionSystem` moves units against, so a destroyed
 * object stops blocking both at once. A port because `abilities/` may not import `physics/`; a dash
 * is cut with it (`abilities/dashReach.ts`).
 */
export interface CollisionQuery {
  /**
   * The share (0 to 1) of `displacement` a circle of `radius` moves from `start` in a straight
   * line before it first touches a wall, kept as far short of it as `CollisionSystem` keeps a
   * walking unit; 1 when nothing is in the way.
   */
  travel(start: Vec2, displacement: Vec2, radius: number): number;
}
