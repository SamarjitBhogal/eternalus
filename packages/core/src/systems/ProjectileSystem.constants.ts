import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';

/**
 * How far past the wall's `reach` a body may be touched and still take the hit. `reach` stops
 * `CONTACT_EPSILON` short of the wall it touches, so a body whose outline is that wall (a fort, a
 * tree) is touched `CONTACT_EPSILON` past it, give or take rounding; the second `CONTACT_EPSILON`
 * is that rounding's margin.
 */
export const BODY_BEFORE_WALL_MARGIN = 2 * CONTACT_EPSILON;
