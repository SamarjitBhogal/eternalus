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
   * in the way. For a mover or a dash: every blocking shape stops it, also one shots can cross.
   *
   * Precondition: the circle at `from` overlaps no wall, as `CollisionSystem` keeps every unit. A
   * circle that starts inside a wall is not stopped by that wall (`CollisionResolver`'s `ponytail`
   * remark).
   */
  reach(from: Vec2, direction: Vec2, distance: number, radius: number): number;

  /**
   * `reach` for a shot launched at `launch`: a shape that does not stop a shot does not stop the
   * sweep (`doesShapeStopShot`). That is a shape flagged `canShotsCross` (a map builder sets it,
   * HC-Q89, DEC-345), and a shape whose blocking area (inside its polygon or
   * on its edge, inside none of its passages) holds `launch` (the launch-shape rule, DEC-334), so a
   * shot launched inside a wall turret's pylon and wall can leave them, also where the turret
   * stands on the joint of two wall pieces. A separate method, so a shot cannot leave out its
   * launch point and get the mover rule (critic Q89-R2-1, DEC-360).
   *
   * Precondition: as `reach`, except that the circle at `from` may overlap a shape that does not
   * stop the shot.
   */
  shotReach(from: Vec2, direction: Vec2, distance: number, radius: number, launch: Vec2): number;

  /**
   * Whether a shot, a circle of `radius` that moves `delta` from `from`, touches a shape flagged
   * `canLightShots` (a map builder sets it, HC-Q89, DEC-345) outside its passages,
   * or starts in one. A passage (a bridge deck) does not light a shot, so a move along the deck
   * does not; a move that leaves the deck over the shape does. Read-only. `ProjectileSystem` lights
   * a shot it is true for, if the shot's definition lets it catch fire.
   */
  lightsShot(from: Vec2, delta: Vec2, radius: number): boolean;
}
