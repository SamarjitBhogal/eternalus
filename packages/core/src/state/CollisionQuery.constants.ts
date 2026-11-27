import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';

/**
 * How far past `CollisionQuery.shotReach` a shot may touch a body and still hit it. `shotReach` stops
 * `CONTACT_EPSILON` short of the wall it touches, so a body whose outline is that wall (a fort, a
 * tree) is touched `CONTACT_EPSILON` past it, give or take rounding; the second `CONTACT_EPSILON`
 * is that rounding's margin. `isTouchedBeforeWall` applies it, for `ProjectileSystem` to land
 * shots and `LineOfFire` to predict them, so the two never disagree about walls.
 */
export const BODY_BEFORE_WALL_MARGIN = 2 * CONTACT_EPSILON;
