import type { Vec2 } from '../../utils/geometry.types';

/** The area part of an effect step (05 §3 `EffectShape`) as the registry sees it: its kind is the key. */
export type ShapeSpec = { readonly kind: string };

/**
 * Where a step's shape sits: a segment from `from` to `to`. A step of the cast itself sits on the
 * caster (`from` = `to`); a dash runs its `onPath` steps on its sweep and its `onEnd` steps where
 * it stops (S1 `EffectShape`).
 */
export type ShapePlacement = { readonly from: Vec2; readonly to: Vec2 };

/**
 * One kind of effect area (plan arch call 12): answers whether a body overlaps it. Stateless; one
 * instance per kind in the `AbilityRegistry`. A new shape kind is one class and one
 * `defaultAbilityRegistry.ts` line.
 */
export interface AreaShape<S extends ShapeSpec = ShapeSpec> {
  /** The registry key, e.g. `circle`. */
  readonly kind: S['kind'];
  /** Whether a body of `radius` at `point` overlaps `shape` placed at `placement`. */
  overlaps(shape: S, placement: ShapePlacement, point: Vec2, radius: number): boolean;
  /**
   * The point of `shape` placed at `placement` nearest to its middle as seen from `point`: what a
   * knock-back at `point` pushes away from (a circle's centre, the nearest point of a path's line).
   */
  centreFor(shape: S, placement: ShapePlacement, point: Vec2): Vec2;
}
