import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { EntityId } from './EntityStore.types';

/** One body as an area sees it: its id, its centre and its collider radius. */
type AreaBody = {
  readonly id: EntityId;
  readonly position: Vec2;
  readonly radius: number;
};

/**
 * The area of one hit, as `AreaHitQuery` asks it: a weapon's wedge or an ability's shape. Each
 * test gets the body's id, so an area can hold one body by id (a sweep's locked target, a `hit`
 * shape's struck body).
 */
export type HitArea = {
  /** Whether the area touches a body that is only its collider circle. */
  overlapsBody(body: AreaBody): boolean;
  /** Whether the area touches `polygon`, one polygon of the outline of `body`. */
  overlapsOutline(polygon: Polygon, body: Pick<AreaBody, 'id' | 'position'>): boolean;
};

/**
 * What a hit aims at: the locked target and the aim point. Each is `null` when there is none. A
 * walk-on outline is hit only when the hit aims at it (DEC-322 (1)).
 */
export type AreaAim = {
  readonly targetId: EntityId | null;
  readonly point: Vec2 | null;
};

/**
 * Which bodies a hit may touch, relative to the attacker. An entity with no team (a map object) is
 * nobody's ally, so it counts as an enemy. The abilities' `TargetFilter` has this shape.
 */
export type AreaFilter = {
  readonly team: 'enemies' | 'allies' | 'all';
  /** Whether the attacker itself may be hit; absent = no. */
  readonly includeSelf?: boolean;
};
