import { BODY_BEFORE_WALL_MARGIN } from './CollisionQuery.constants';

/**
 * Whether a shot that touches a body `contact` metres along its way hits that body before the
 * wall it reaches `wallReach` metres along (`CollisionQuery.shotReach`; infinite with no wall in the
 * way). A contact up to `BODY_BEFORE_WALL_MARGIN` past `wallReach` counts, so a body whose outline
 * is the wall (a fort, a tree) takes the hit. The one rule by which `ProjectileSystem` lands a shot
 * and `LineOfFire` predicts it (DEC-317 (6)).
 */
export const isTouchedBeforeWall = (contact: number, wallReach: number): boolean =>
  contact <= wallReach + BODY_BEFORE_WALL_MARGIN;
