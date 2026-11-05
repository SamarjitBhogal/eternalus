import type { Vec2 } from '../utils/geometry.types';

/**
 * The facing of an entity that has not turned yet: east, the zero angle of `utils/geometry`. DEC-192
 * sets facing only by movement and attacks, and no source names a facing at spawn.
 */
// TUNE: provisional; no source names a start facing (INBOX.md, "Unit facing chevron", question 1)
export const INITIAL_FACING: Vec2 = { x: 1, y: 0 };
