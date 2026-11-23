import type { EntityId } from '../../state/EntityStore.types';
import type { Polygon, Vec2 } from '../../utils/geometry.types';

/** The area part of an effect step (05 §3 `EffectShape`) as the registry sees it: its kind is the key. */
export type ShapeSpec = { readonly kind: string };

/**
 * Where a step's shape sits: a segment from `from` to `to`. A step of the cast itself sits on the
 * caster (`from` = `to`); a dash runs its `onPath` steps on its sweep and its `onEnd` steps where
 * it stops (S1 `EffectShape`). `targetId` is the body an on-hit cast struck (`HitEffects.runSteps`),
 * the one body the `hit` shape holds.
 */
export type ShapePlacement = {
  readonly from: Vec2;
  readonly to: Vec2;
  readonly targetId?: EntityId;
};

/** A body a shape is tested against: its id, and the circle of a body that is not a map object. */
export type ShapeBody = {
  readonly id: EntityId;
  readonly position: Vec2;
  readonly radius: number;
};

/**
 * The list a step is authored in, as the boot check sees it (HC-B26 (5)): `isOnHit` for an `onHit`
 * list (a shot's or a status's), the one list whose steps are placed on a struck body.
 */
export type StepList = { readonly isOnHit: boolean };

/**
 * One kind of effect area (plan arch call 12): answers whether a body overlaps it. Stateless; one
 * instance per kind in the `AbilityRegistry`. A new shape kind is one class and one
 * `defaultAbilityRegistry.ts` line.
 */
export interface AreaShape<S extends ShapeSpec = ShapeSpec> {
  /** The registry key, e.g. `circle`. */
  readonly kind: S['kind'];
  /**
   * What is wrong with `shape` as authored in a step of `list`, or nothing; run at boot by
   * `AbilityRegistry.resolveAll` and `checkStatusLinks`.
   */
  validate(shape: S, list: StepList): readonly string[];
  /** Whether `body` (its circle, or its id) overlaps `shape` placed at `placement`. */
  overlaps(shape: S, placement: ShapePlacement, body: ShapeBody): boolean;
  /**
   * Whether `polygon` (one footprint of the map object `body`: a house, a wall, a fort) overlaps
   * `shape` placed at `placement`, measured to its outline as basic attacks are
   * (`ReachQuery.isInReach`), or, for a shape that holds one body, whether `body` is that body.
   */
  overlapsPolygon(
    shape: S,
    placement: ShapePlacement,
    polygon: Polygon,
    body: Pick<ShapeBody, 'id'>,
  ): boolean;
  /**
   * The point of `shape` placed at `placement` nearest to its middle as seen from `point`: what a
   * knock-back at `point` pushes away from (a circle's centre, the nearest point of a path's line).
   */
  centreFor(shape: S, placement: ShapePlacement, point: Vec2): Vec2;
}
