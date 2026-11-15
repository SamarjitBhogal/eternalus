import type { Vec2 } from '../utils/geometry.types';

/**
 * The facing of an entity given no start facing and not yet turned: east, the zero angle of
 * `utils/geometry`. `StateHasher` leaves it out of the hash.
 */
export const INITIAL_FACING: Vec2 = { x: 1, y: 0 };
