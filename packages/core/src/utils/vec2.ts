import { sqrt } from './deterministicMath';
import type { Vec2 } from './geometry.types';
import type { MutableVec2 } from './vec2.types';

/**
 * Vector maths on `Vec2`. Each operation has an immutable form (`add`) that returns a new vector
 * and an in-place form (`addInto`) that writes into `out` and returns it, for hot loops that must
 * not allocate. `out` may be one of the inputs. Both forms share one implementation, so they agree
 * bit for bit.
 */

/** `out = a + b`; returns `out`. */
export const addInto = (out: MutableVec2, a: Vec2, b: Vec2): MutableVec2 => {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
};

/** `out = a - b`; returns `out`. */
export const subInto = (out: MutableVec2, a: Vec2, b: Vec2): MutableVec2 => {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
};

/** `out = v * factor`; returns `out`. */
export const scaleInto = (out: MutableVec2, v: Vec2, factor: number): MutableVec2 => {
  out.x = v.x * factor;
  out.y = v.y * factor;
  return out;
};

/** Dot product of `a` and `b`. */
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

/** Euclidean length of `v`. */
export const length = (v: Vec2): number => sqrt(dot(v, v));

/** `out = v` scaled to length 1, or the zero vector when `v` has no length (never NaN). */
export const normalizeInto = (out: MutableVec2, v: Vec2): MutableVec2 => {
  const size = length(v);
  if (size === 0) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  return scaleInto(out, v, 1 / size);
};

/** `a + b` as a new vector. */
export const add = (a: Vec2, b: Vec2): Vec2 => addInto({ x: 0, y: 0 }, a, b);

/** `a - b` as a new vector. */
export const sub = (a: Vec2, b: Vec2): Vec2 => subInto({ x: 0, y: 0 }, a, b);

/** `v * factor` as a new vector. */
export const scale = (v: Vec2, factor: number): Vec2 => scaleInto({ x: 0, y: 0 }, v, factor);

/** `v` scaled to length 1 as a new vector, or the zero vector when `v` has no length. */
export const normalize = (v: Vec2): Vec2 => normalizeInto({ x: 0, y: 0 }, v);
