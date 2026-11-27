import type { ProjectilePayload } from '../components/ProjectilePayload';
import { AreaHitQuery } from '../state/AreaHitQuery';
import type { EntityStore } from '../state/EntityStore';
import { doesDiscReachPolygon } from '../utils/circlePolygon';
import { distance } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import type { ShotBody } from './ProjectileSystem.types';

/**
 * Where an arc shot lands (DEC-342): which body is under it when it reaches its aim point. The
 * candidates are the bodies a shot stops on (`AreaHitQuery.stopsShot`, so a walk-on outline only
 * when the shot aims at it) whose collider circle, or outline polygons that a straight shot stops
 * on (`AreaHitQuery.shotPolygonsOf`), meet the shot's circle there. A body that takes no damage
 * now (`EntityStore.takesNoDamage`: a wall, a gate, a forest camp) is not a candidate: nothing
 * lands on it, so a unit beside it still takes the hit. The shot's target wins if it is a
 * candidate, else the first candidate in store order. A turret's shot names no target: a turret
 * aims at a point (`attack-aim`), and the enemy walk-on outlines that `AreaHitQuery.aimedBodyOf`
 * could name for that point (the enemy palace and gates) are far out of every turret's reach. So
 * under a turret's shot a tie goes to store order. Stateless.
 */
export class ArcLanding {
  /**
   * @param bodies - The live bodies, in store order (`ProjectileSystem`'s gather).
   * @param point - Where the shot's centre is.
   * @param radius - The shot's circle radius.
   * @returns The body under the shot, or `null` for bare ground.
   */
  public bodyUnder(
    entities: EntityStore,
    payload: ProjectilePayload,
    bodies: readonly ShotBody[],
    point: Vec2,
    radius: number,
  ): ShotBody | null {
    let first: ShotBody | null = null;
    for (const body of bodies) {
      if (
        !AreaHitQuery.stopsShot(entities, payload, body) ||
        entities.takesNoDamage(body.entity.id) ||
        !this.isUnder(payload, body, point, radius)
      ) {
        continue;
      }
      if (body.entity.id === payload.targetId) return body;
      first ??= body;
    }
    return first;
  }

  /**
   * Whether the body's collider circle, or the polygons of its outline that a straight shot stops
   * on (`AreaHitQuery.shotPolygonsOf`: one rule for both kinds of shot), meet the circle at
   * `point`.
   */
  private isUnder(
    payload: ProjectilePayload,
    body: ShotBody,
    point: Vec2,
    radius: number,
  ): boolean {
    const { transform, outline } = body;
    if (outline === null) {
      return distance(point, transform.position) <= radius + transform.radius;
    }
    return AreaHitQuery.shotPolygonsOf(payload, body).some((polygon) =>
      doesDiscReachPolygon(point, radius, polygon),
    );
  }
}
