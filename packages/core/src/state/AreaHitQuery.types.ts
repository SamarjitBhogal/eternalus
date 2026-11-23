import type { Health } from '../components/Health';
import type { Outline } from '../components/Outline.types';
import type { TeamMembership } from '../components/TeamMembership';
import type { Entity } from '../entities/Entity';
import type { Team } from '../teams/teams.types';
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

/**
 * The attacker as `AreaHitQuery.find` reads it: its team (none: nobody's ally, so every body counts
 * as an enemy) and where it stands (none: no walk-on outline is aimed at by point, rule 1).
 */
export type AreaAttacker = {
  readonly team: Team | undefined;
  readonly position: Vec2 | undefined;
};

/**
 * A shot as the rule that stops it sees it (`AreaHitQuery.stopsShot`): who fired it, for which
 * team, and what it aims at (`ProjectilePayload` has this shape).
 */
export type ShotAim = {
  readonly ownerId: EntityId;
  readonly team: Team;
  /** The locked target, or the walk-on outline the aim point was on; `null` for neither. */
  readonly targetId: EntityId | null;
};

/** A body as the rule that stops a shot sees it, read once by the caller. */
export type ShotStopBody = {
  readonly entity: Entity;
  readonly health: Health;
  readonly membership: TeamMembership | undefined;
  /** What a shot touches; `null` for a body that is only its collider circle. */
  readonly outline: Outline | null;
};
