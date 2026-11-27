import { Combat } from '../components/Combat';
import { Transform } from '../components/Transform';
import { distance, isPointInAnyPolygon, nearestPointOnPolygons } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { EntityStore } from './EntityStore';
import type { EntityId } from './EntityStore.types';
import type { AimedAt } from './ReachQuery.types';

/**
 * The one aim rule of an attack (architecture 05 §10): the point of a target that attack reach is
 * measured to, that a chase heads for and that the attacker faces. `Simulation` builds one for the
 * match and injects it; a caller passes the store, as with `AreaHitQuery`. Its only state is a
 * scratch point that `isInReach` writes and reads in one call. So one instance is safe to share:
 * the tick runs one call at a time.
 */
export class ReachQuery {
  /** Scratch for `isInReach`'s aim point. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /**
   * Whether `targetId` is within `attackerId`'s attack reach, measured edge to edge between the
   * two footprints to the point `aimPointOf` gives: on the target's outline when it has one
   * (`EntityStore.outlineOf`: a map object, or a lane tower's fort, DEC-185), standing inside an
   * outline counting as in reach; else to its collider circle. `false` when either is unknown,
   * either has no `Transform`, or the attacker cannot attack.
   */
  public isInReach(entities: EntityStore, attackerId: EntityId, targetId: EntityId): boolean {
    const attacker = entities.get(attackerId);
    const combat = attacker?.findComponent(Combat);
    const from = attacker?.findComponent(Transform);
    const to = entities.get(targetId)?.findComponent(Transform);
    if (combat === undefined || from === undefined || to === undefined) {
      return false;
    }
    const aimed = this.aimPointOf(entities, targetId, from.position, this.aim);
    if (aimed === null) {
      return false;
    }
    if (aimed === 'centre') {
      const gap = distance(from.position, this.aim);
      return gap - from.radius - to.radius <= combat.attack.reach;
    }
    return distance(from.position, this.aim) <= from.radius + combat.attack.reach;
  }

  /**
   * Writes into `out` the point of `targetId` that attack reach from `from` is measured to, which a
   * chase heads for (`StuckSystem`, `PathingSystem`): `from` itself when it stands inside the
   * target's outline (`EntityStore.outlineOf`), so it is in reach and a chase holds there
   * (DEC-234); else the point of the outline nearest `from`; else the target's centre (reach then
   * also spans its collider radius). An attacker outside the outline faces this point
   * (`facingPointOf`, DEC-216 (11)). Returns what it aimed at (`AimedAt`), so the inside test runs
   * only here, or `null`, leaving `out` as it was, when the target is unknown, has no position, or
   * its outline has no corners.
   */
  public aimPointOf(
    entities: EntityStore,
    targetId: EntityId,
    from: Vec2,
    out: MutableVec2,
  ): AimedAt | null {
    const outline = entities.outlineOf(targetId)?.polygons;
    if (outline !== undefined) {
      if (isPointInAnyPolygon(from, outline)) {
        out.x = from.x;
        out.y = from.y;
        return 'inside';
      }
      return nearestPointOnPolygons(from, outline, out) === Number.POSITIVE_INFINITY
        ? null
        : 'outline';
    }
    const at = entities.get(targetId)?.findComponent(Transform)?.position;
    if (at === undefined) {
      return null;
    }
    out.x = at.x;
    out.y = at.y;
    return 'centre';
  }

  /**
   * Writes into `out` the point `attackerId` faces while it attacks `targetId`: the aim point
   * (`aimPointOf`, DEC-216 (11)), except that an attacker standing inside the target's outline,
   * whose aim point is where it stands (DEC-234), faces the target's centre (DEC-220 (1)). A
   * fort's court is outside its outline, so a unit there faces the aim point (DEC-226). Reach and
   * chase keep `aimPointOf`. `false`, leaving `out` as it was, when either has no position or the
   * target has no aim point.
   */
  public facingPointOf(
    entities: EntityStore,
    attackerId: EntityId,
    targetId: EntityId,
    out: MutableVec2,
  ): boolean {
    const from = entities.get(attackerId)?.findComponent(Transform)?.position;
    const centre = entities.get(targetId)?.findComponent(Transform)?.position;
    if (from === undefined || centre === undefined) {
      return false;
    }
    const aimed = this.aimPointOf(entities, targetId, from, out);
    if (aimed === 'inside') {
      out.x = centre.x;
      out.y = centre.y;
    }
    return aimed !== null;
  }
}
