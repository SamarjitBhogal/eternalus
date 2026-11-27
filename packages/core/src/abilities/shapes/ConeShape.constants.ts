import type { Vec2 } from '../../utils/geometry.types';

/** A full turn in degrees: a fan this wide is the whole circle of its reach. */
export const FULL_TURN_DEGREES = 360;

/** The direction of a placement that has none: a fan then points nowhere. */
export const NO_DIRECTION: Vec2 = { x: 0, y: 0 };
