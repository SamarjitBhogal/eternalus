import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { ProjectilePayload } from '../components/ProjectilePayload';
import type { ProjectileImpactKind } from '../components/ProjectilePayload.types';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type {
  ProjectileHit,
  ProjectileImpact,
  ProjectileImpacts,
} from '../combat/ProjectileImpact.types';
import type { Entity } from '../entities/Entity';
import { flightSpeed } from '../physics/flightSpeed';
import { sweepCircle } from '../physics/sweepCircle';
import { sweepDisc } from '../physics/sweepDisc';
import { BODY_BEFORE_WALL_MARGIN } from '../state/CollisionQuery.constants';
import type { GameState } from '../state/GameState';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import { distance, doRectsOverlap, isPointInAnyPolygon } from '../utils/geometry';
import type { Rect, Vec2 } from '../utils/geometry.types';
import type { ShotBody, ShotContact } from './ProjectileSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Flies the shots in the air to their end (architecture 10 §7): each tick, every shot's move (an
 * entity with a `ProjectilePayload`) from `Transform.previousPosition` to `position` is swept as a
 * circle against the bodies it can hit and the walls, and the earliest contact ends it. A body
 * takes the hit when it is touched before the first wall, or up to `BODY_BEFORE_WALL_MARGIN` past
 * the point where `CollisionQuery.reach` stops (a fort is both a body and a wall); a wall or the
 * map's edge spends the shot with no damage. A landed hit goes to the `ProjectileImpact` of the
 * payload's impact kind (a weapon's: its damage, fallen off over the distance from the origin,
 * then the owner's on-hit effects), and the shot is removed as `consumed`.
 *
 * Bodies are live things with `Health` other than the owner and its team (neutral bodies count as
 * enemies). A body with an outline (`Footprint`, `MapObjectBody`) is hit on that outline, at once
 * when the shot starts inside it. A walk-on outline (a palace floor, a gate's passage) and a body
 * that takes no damage now (`Collider.isUnbreakable`: a forest camp, a gate before its rule
 * passes) are hit only by a shot fired at that entity, so a shot flies over the ground units stand
 * on and past what it cannot hurt (DEC-317). A body is gathered
 * once a tick, and each move tests only those whose box it reaches. Ties go to the first body in
 * store order.
 *
 * A shot that touches nothing flies to the end of its `range` (DEC-306): it slows from `slowFrom`
 * (`flightSpeed`, through `Movement.limitSpeed`) so it stops exactly at `range`, then ends. An
 * ended shot is swept no more and hits nothing; it stays for its end duration (a mist, an arrow on
 * the ground), then is removed as `consumed`. While the match holds units idle
 * (`state.match.isIdleHeld`, the countdown) no shot lands, slows or ends.
 *
 * It runs right before `CombatSystem`, so a shot fired this tick flies a tick before it can land.
 */
export class ProjectileSystem implements System {
  public readonly name = 'projectiles';
  /**
   * Shots in the air at the start of this tick. A copy, because a shot spawned by an on-hit effect
   * during the walk would otherwise fly at once (`Map.forEach` visits entries added during it).
   */
  private readonly flying: Entity[] = [];
  /** The bodies a shot can hit this tick, in store order; gathered on the first move. */
  private readonly bodies: ShotBody[] = [];
  private isGathered = false;

  /** @param impacts - What a landed shot does, by its payload's impact kind. */
  public constructor(private readonly impacts: ProjectileImpacts) {}

  /** Flies every shot in the air, in store order. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) {
      return;
    }
    state.entities.forEach((entity) => {
      if (entity.hasComponent(ProjectilePayload)) {
        this.flying.push(entity);
      }
    });
    for (const shot of this.flying) {
      this.fly(state, shot);
    }
    this.flying.length = 0;
    this.bodies.length = 0;
    this.isGathered = false;
  }

  private fly(state: GameState, shot: Entity): void {
    const flight = shot.getComponent(ProjectileFlight);
    if (flight.isEnded) {
      if (flight.tickEnding()) this.spend(state, shot);
      return;
    }
    if (!this.isGathered) this.gather(state);
    const payload = shot.getComponent(ProjectilePayload);
    const body = shot.getComponent(Transform);
    const from = body.previousPosition;
    const delta = { x: body.position.x - from.x, y: body.position.y - from.y };
    const length = distance(from, body.position);

    const wall = this.wallDistance(state, from, delta, length, body.radius);
    const hit = this.firstBody(state, payload, from, delta, body.radius);
    if (hit !== null && hit.time * length <= wall + BODY_BEFORE_WALL_MARGIN) {
      this.landOn(state, {
        impact: payload.impact,
        ownerId: payload.ownerId,
        source: payload.source,
        origin: payload.origin,
        bodyId: hit.body.entity.id,
        point: { x: from.x + delta.x * hit.time, y: from.y + delta.y * hit.time },
      });
      this.spend(state, shot);
    } else if (wall < Number.POSITIVE_INFINITY) {
      this.spend(state, shot);
    } else {
      this.steerToEnd(shot, flight, distance(payload.origin, body.position));
    }
  }

  /** Hands the hit to the impact of its kind. */
  private landOn<K extends ProjectileImpactKind>(state: GameState, hit: ProjectileHit<K>): void {
    const impact: ProjectileImpact<K> = this.impacts[hit.impact.kind];
    impact.land(state, hit);
  }

  /** Slows the shot toward its range, or ends it and stops it there when it has flown all of it. */
  private steerToEnd(shot: Entity, flight: ProjectileFlight, flown: number): void {
    const movement = shot.getComponent(Movement);
    const remaining = flight.range - flown;
    if (remaining <= CONTACT_EPSILON) {
      flight.end();
      movement.steer({ x: 0, y: 0 });
      return;
    }
    movement.limitSpeed(flightSpeed(movement.maxSpeed, flown, flight.range, flight.slowFrom));
  }

  /** How far along the move the first wall or the map's edge is; infinite when none is in it. */
  private wallDistance(
    state: GameState,
    from: Vec2,
    delta: Vec2,
    length: number,
    radius: number,
  ): number {
    if (state.collisions === null || length === 0) return Number.POSITIVE_INFINITY;
    const dir = { x: delta.x / length, y: delta.y / length };
    const reach = state.collisions.reach(from, dir, length, radius);
    return reach < length ? reach : Number.POSITIVE_INFINITY;
  }

  /** Every live entity with `Health` and a `Transform`, in store order, with its outline if any. */
  private gather(state: GameState): void {
    state.entities.forEach((entity) => {
      const health = entity.findComponent(Health);
      const transform = entity.findComponent(Transform);
      if (health === undefined || transform === undefined) return;
      this.bodies.push({
        entity,
        transform,
        health,
        membership: entity.findComponent(TeamMembership),
        collider: entity.findComponent(Collider),
        outline: state.entities.outlineOf(entity.id) ?? null,
      });
    });
    this.isGathered = true;
  }

  /** The earliest body the move touches (ties go to the first in store order), or `null`. */
  private firstBody(
    state: GameState,
    payload: ProjectilePayload,
    from: Vec2,
    delta: Vec2,
    radius: number,
  ): ShotContact | null {
    // The box the moving circle sweeps, a contact's width wider so rounding never drops one.
    const reach = radius + CONTACT_EPSILON;
    const box: Rect = {
      x: Math.min(from.x, from.x + delta.x) - reach,
      y: Math.min(from.y, from.y + delta.y) - reach,
      width: Math.abs(delta.x) + 2 * reach,
      height: Math.abs(delta.y) + 2 * reach,
    };
    let first: ShotContact | null = null;
    for (const body of this.bodies) {
      if (!ProjectileSystem.isNear(body, box) || !ProjectileSystem.canHit(state, payload, body)) {
        continue;
      }
      const time = ProjectileSystem.contactTime(body, from, delta, radius);
      if (time !== null && (first === null || time < first.time)) {
        first = { body, time };
      }
    }
    return first;
  }

  /** Whether the body's box (its outline's, or its collider circle's) meets `box`. */
  private static isNear({ transform, outline }: ShotBody, box: Rect): boolean {
    if (outline !== null) return doRectsOverlap(outline.bounds, box);
    const { position, radius } = transform;
    return (
      position.x + radius >= box.x &&
      position.x - radius <= box.x + box.width &&
      position.y + radius >= box.y &&
      position.y - radius <= box.y + box.height
    );
  }

  /**
   * Whether the shot can hit the body now: alive and still in the world, not its owner, not on its
   * team, and, for a walk-on outline or a body that takes no damage now, the entity it was fired at.
   */
  private static canHit(
    state: GameState,
    payload: ProjectilePayload,
    { entity, health, membership, collider, outline }: ShotBody,
  ): boolean {
    return (
      !health.isDead &&
      entity.id !== payload.ownerId &&
      membership?.team !== payload.team &&
      (entity.id === payload.targetId ||
        (outline?.isWalkOn !== true && collider?.isUnbreakable !== true)) &&
      state.entities.has(entity.id)
    );
  }

  /** The share (0 to 1) of the move at which it touches the body, 0 if it starts touching. */
  private static contactTime(
    { transform, outline }: ShotBody,
    from: Vec2,
    delta: Vec2,
    radius: number,
  ): number | null {
    if (outline === null) {
      return sweepDisc(from, delta, radius, transform.position, transform.radius);
    }
    if (isPointInAnyPolygon(from, outline.polygons)) return 0;
    let first: number | null = null;
    for (const polygon of outline.polygons) {
      const time = sweepCircle(from, delta, radius, polygon)?.time;
      if (time !== undefined && (first === null || time < first)) first = time;
    }
    return first;
  }

  private spend(state: GameState, shot: Entity): void {
    state.entities.remove(shot.id, 'consumed');
    state.events.emit('entity-removed', { entityId: shot.id, cause: 'consumed' });
  }
}
