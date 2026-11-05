import type { Vec2 } from '../utils/geometry.types';

/**
 * The facing of an entity that has not turned and was given no start facing: east, the zero angle
 * of `utils/geometry`. In a match a unit is given one (DEC-216 (6): toward the enemy Stronghold, a
 * guard out from its home), so this is the fallback for a neutral unit that is no guard, a match
 * without a map, and entities that never turn (structures, obstacles). `StateHasher` leaves it out
 * of the hash, so states made only of such entities hash as they did before facing existed.
 */
export const INITIAL_FACING: Vec2 = { x: 1, y: 0 };
