import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { HitEffects } from '../abilities/HitEffects';
import type { Entity } from '../entities/Entity';
import { Projectile } from '../entities/Projectile';
import { sweepCircle } from '../physics/sweepCircle';
import { sweepDisc } from '../physics/sweepDisc';
import type { GameState } from '../state/GameState';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import { distance, isPointInAnyPolygon } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import { sqrt } from '../utils/deterministicMath';
import type { DamagePipeline } from './DamagePipeline';
import { falloffMultiplier } from './falloffMultiplier';
import { flightSpeed } from './flightSpeed';

/**
 * Flies the shots in the air to their end (architecture 10 §7): each tick, every projectile's move
 * from `Transform.previousPosition` to `position` is swept as a circle against the bodies it can
 * hit and the walls, and the earliest contact ends it. A body takes the hit when it is touched
 * before, or within `CONTACT_EPSILON` of, the first wall (a fort is both a body and a wall); a wall
 * or the map's edge spends the shot with no damage. A landed hit deals the attack's damage scaled by
 * its fall-off over the distance from the shot's origin, through the match's damage pipeline, then
 * runs the owner's on-hit effects (as melee does); the shot is then removed as `consumed`.
 * Bodies are live things with `Health`, other than the owner and its team (neutral bodies count as
 * enemies).
 *
 * A shot that touches nothing flies to the end of its `range` (DEC-306): it slows from `slowFrom`
 * (`flightSpeed`, through `Movement.limitSpeed`) so it stops exactly at `range`, then ends. An
 * ended shot is swept no more and hits nothing; it stays for its end duration (a mist, an arrow
 * on the ground), then is removed as `consumed`.
 */
export class ProjectileLanding {
  /** Projectiles in the air at the start of this tick's landing. */
  private readonly flying: Projectile[] = [];

  /**
   * @param damage - The match's one damage pipeline.
   * @param hits - Runs the owner's statuses' `onHit` steps after a hit lands; `null` runs none.
   */
  public constructor(
    private readonly damage: DamagePipeline,
    private readonly hits: Pick<HitEffects, 'afterHit'> | null,
  ) {}

  /** Lands every projectile in flight, in store order. */
  public land(state: GameState): void {
    this.flying.length = 0;
    state.entities.forEach((entity) => {
      if (entity instanceof Projectile && entity.hasComponent(ProjectilePayload)) {
        this.flying.push(entity);
      }
    });
    for (const shot of this.flying) {
      this.fly(state, shot);
    }
    this.flying.length = 0;
  }

  private fly(state: GameState, shot: Projectile): void {
    const flight = shot.getComponent(ProjectileFlight);
    if (flight.isEnded) {
      if (flight.tickEnding()) this.spend(state, shot);
      return;
    }
    const payload = shot.getComponent(ProjectilePayload);
    const body = shot.getComponent(Transform);
    const from = body.previousPosition;
    const delta = { x: body.position.x - from.x, y: body.position.y - from.y };
    const length = sqrt(delta.x * delta.x + delta.y * delta.y);

    const wall = this.wallDistance(state, from, delta, length, body.radius);
    const hit = this.firstBody(state, shot, payload, from, delta, body.radius);
    if (hit !== null && hit.time * length <= wall + CONTACT_EPSILON) {
      const point = { x: from.x + delta.x * hit.time, y: from.y + delta.y * hit.time };
      const { attack, source } = payload;
      const share = falloffMultiplier(attack.projectile.falloff, distance(payload.origin, point));
      this.damage.apply(state, hit.id, attack.damage * share, source);
      this.hits?.afterHit(state, payload.ownerId, hit.id);
      this.spend(state, shot);
    } else if (wall < Infinity) {
      this.spend(state, shot);
    } else {
      this.steerToEnd(shot, flight, distance(payload.origin, body.position));
    }
  }

  /** Slows the shot toward its range, or ends it and stops it there when it has flown all of it. */
  private steerToEnd(shot: Projectile, flight: ProjectileFlight, flown: number): void {
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

  /** The earliest body the move touches (ties go to the first in store order), or `null`. */
  private firstBody(
    state: GameState,
    shot: Entity,
    payload: ProjectilePayload,
    from: Vec2,
    delta: Vec2,
    radius: number,
  ): { readonly id: string; readonly time: number } | null {
    let first: { readonly id: string; readonly time: number } | null = null;
    // ponytail: store walk per projectile, ceiling O(projectiles x entities), upgrade = space query
    state.entities.forEach((entity) => {
      const position = entity.findComponent(Transform)?.position;
      if (
        entity === shot ||
        entity.id === payload.ownerId ||
        position === undefined ||
        entity.findComponent(Health)?.isDead !== false ||
        entity.findComponent(TeamMembership)?.team === payload.team
      ) {
        return;
      }
      const time = this.contactTime(state, entity, from, delta, radius);
      if (time !== null && (first === null || time < first.time)) {
        first = { id: entity.id, time };
      }
    });
    return first;
  }

  /** The share (0 to 1) of the move at which it touches `entity`, 0 if it starts touching. */
  private contactTime(
    state: GameState,
    entity: Entity,
    from: Vec2,
    delta: Vec2,
    radius: number,
  ): number | null {
    const outline = state.entities.outlineOf(entity.id);
    if (outline === undefined) {
      const body = entity.getComponent(Transform);
      return sweepDisc(from, delta, radius, body.position, body.radius);
    }
    if (isPointInAnyPolygon(from, outline)) return 0;
    let first: number | null = null;
    for (const polygon of outline) {
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
