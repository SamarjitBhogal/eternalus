import type { Vec2 } from './geometry.types';

/**
 * How far a circle reaches into a polygon (`depth`, positive when they overlap; the radius minus
 * the gap between them otherwise) and the unit direction that leads out of it fastest (`normal`).
 */
export type CirclePenetration = { readonly depth: number; readonly normal: Vec2 };
