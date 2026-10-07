import { sqrt } from './deterministicMath';
import type { Vec2 } from './geometry.types';

/** `a + b`. */
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

/** `a - b`. */
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

/** `v * factor`. */
export const scale = (v: Vec2, factor: number): Vec2 => ({ x: v.x * factor, y: v.y * factor });

/** Dot product of `a` and `b`. */
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

/** Euclidean length of `v`. */
export const length = (v: Vec2): number => sqrt(dot(v, v));

/** `v` scaled to length 1, or the zero vector when `v` has no length (never NaN). */
export const normalize = (v: Vec2): Vec2 => {
  const size = length(v);
  return size === 0 ? { x: 0, y: 0 } : scale(v, 1 / size);
};
