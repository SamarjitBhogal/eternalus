import { Health } from '../components/Health';
import type { Outline } from '../components/Outline.types';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import { isUnitFamily } from '../entities/unitFamilies';
import type { Team } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import { isPointInAnyPolygon } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import type { AreaAim, AreaFilter, HitArea, ShotAim, ShotStopBody } from './AreaHitQuery.types';
import type { EntityStore } from './EntityStore';
import type { EntityId } from './EntityStore.types';

/**
 * The one hit rule for weapon areas and ability areas (DEC-322 (3)): which live bodies an area
 * touches. The weapon sweep and the abilities' `TargetQuery` hand it their area as a `HitArea`.
 * It walks the live bodies with a `Transform` and `Health`, filters them by team relative to the
 * attacker, and tests each one against the area. A body with an outline (`EntityStore.outlineOf`:
 * a map object, a structure footprint) is tested by its polygons; any other body by its collider
 * circle. Then two rules apply:
 *
 * 1. A walk-on outline (a palace floor, a gate's passage) is hit only when the hit aims at it
 *    (DEC-322 (1)): it is the locked target, or the aim point is on the outline, on no enemy unit
 *    (the rule of `findUnitAt`) and the attacker stands outside the outline. A swing inside the
 *    enemy palace does not hit the Stronghold; from outside, aiming at the palace floor does.
 * 2. A body that takes no damage now (`EntityStore.takesNoDamage`) is never hit: it takes no
 *    damage and runs no on-hit step (DEC-317 addendum). A shot stops on it (`ProjectileSystem`).
 *
 * It also holds the one rule for which bodies stop a shot (`stopsShot`), which `ProjectileSystem`
 * flies shots by and `LineOfFire` predicts them by. Ids come back in `compareById` order, so every
 * run hits in the same order. Stateless.
 *
 * ponytail: a walk over the store, not the `SpatialHash`, O(entities) per area. Only Legends
 * sweep and casts are rare. Ceiling: many sweepers (mob weapons); upgrade to a `SpatialHash`
 * query then.
 */
export class AreaHitQuery {
  /**
   * Whether `shot` stops on `body` when it touches it (DEC-317 addendum, DEC-322 (1)): the body is
   * alive and still in the world, not the shot's owner and not on its team (no team counts as
   * enemy), and, for a walk-on outline, the entity the shot aims at (`shot.targetId`), so a shot
   * flies over the ground units stand on. A body that takes no damage now
   * (`EntityStore.takesNoDamage`) stops it too, and nothing lands on it. The one rule by which
   * `ProjectileSystem` flies a shot and `LineOfFire` predicts it.
   */
  public static stopsShot(entities: EntityStore, shot: ShotAim, body: ShotStopBody): boolean {
    const { entity, health, membership, outline } = body;
    return (
      !health.isDead &&
      entity.id !== shot.ownerId &&
      membership?.team !== shot.team &&
      (outline?.isWalkOn !== true || entity.id === shot.targetId) &&
      entities.has(entity.id)
    );
  }

  /**
   * The ids of the live bodies that `area` touches and `filter` lets through for `attackerId`,
   * under rules 1 and 2, sorted by id.
   *
   * @param aim - What the hit aims at; a walk-on outline needs it (rule 1).
   */
  public find(
    entities: EntityStore,
    attackerId: EntityId,
    area: HitArea,
    aim: AreaAim,
    filter: AreaFilter,
  ): EntityId[] {
    const attackerTeam = entities.teamOf(attackerId);
    const from = entities.get(attackerId)?.findComponent(Transform)?.position;
    const hits: EntityId[] = [];
    entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      if (
        transform === undefined ||
        !AreaHitQuery.isAlive(entity) ||
        (entity.id === attackerId && filter.includeSelf !== true) ||
        !AreaHitQuery.passes(filter, AreaHitQuery.isAlly(entity, attackerTeam)) ||
        entities.takesNoDamage(entity.id)
      ) {
        return;
      }
      const { id } = entity;
      const outline = entities.outlineOf(id);
      if (outline === undefined) {
        if (area.overlapsBody({ id, position: transform.position, radius: transform.radius })) {
          hits.push(id);
        }
        return;
      }
      if (
        outline.isWalkOn &&
        aim.targetId !== id &&
        !(
          aim.point !== null &&
          AreaHitQuery.isAimedByPoint(entities, attackerTeam, outline, aim.point, from)
        )
      ) {
        return;
      }
      const body = { id, position: transform.position };
      if (outline.polygons.some((polygon) => area.overlapsOutline(polygon, body))) {
        hits.push(id);
      }
    });
    return hits.sort(compareById);
  }

  /**
   * The walk-on outline that `attackerId` aims at with `point` under rule 1, which its shot then
   * names as its target (`ProjectilePayload.targetId`), so the shot can hit it. Only enemy bodies
   * (no team counts as enemy). When several walk-on outlines hold the point (a palace floor is both
   * the Stronghold's outline and the palace map object's), a structure comes first, then the first
   * by id, so a shot at the palace names the Stronghold. A sweep still hits both (DEC-284 (2)).
   *
   * @returns The body's id, or `null` when the point is on no such outline, on an enemy unit, or
   *   the attacker stands inside the outline or is unknown.
   */
  public aimedBodyOf(entities: EntityStore, attackerId: EntityId, point: Vec2): EntityId | null {
    const attackerTeam = entities.teamOf(attackerId);
    const from = entities.get(attackerId)?.findComponent(Transform)?.position;
    const aimed: EntityId[] = [];
    entities.forEach((entity) => {
      const outline = entities.outlineOf(entity.id);
      if (
        outline?.isWalkOn === true &&
        entity.hasComponent(Transform) &&
        AreaHitQuery.isAlive(entity) &&
        !AreaHitQuery.isAlly(entity, attackerTeam) &&
        AreaHitQuery.isOnOutlineFromOutside(outline, point, from)
      ) {
        aimed.push(entity.id);
      }
    });
    if (aimed.length === 0 || AreaHitQuery.isEnemyUnitAt(entities, attackerTeam, point)) {
      return null;
    }
    const isStructure = (id: EntityId): number =>
      entities.get(id)?.family === 'structure' ? 0 : 1;
    return aimed.sort((a, b) => isStructure(a) - isStructure(b) || compareById(a, b))[0] ?? null;
  }

  /** Rule 1 by aim point: on the outline, the attacker outside it, and on no enemy unit. */
  private static isAimedByPoint(
    entities: EntityStore,
    attackerTeam: Team | undefined,
    outline: Outline,
    point: Vec2,
    from: Vec2 | undefined,
  ): boolean {
    return (
      AreaHitQuery.isOnOutlineFromOutside(outline, point, from) &&
      !AreaHitQuery.isEnemyUnitAt(entities, attackerTeam, point)
    );
  }

  /** Whether `point` is on the outline and `from` (the attacker) is known and outside it. */
  private static isOnOutlineFromOutside(
    { polygons }: Outline,
    point: Vec2,
    from: Vec2 | undefined,
  ): boolean {
    return (
      from !== undefined &&
      isPointInAnyPolygon(point, polygons) &&
      !isPointInAnyPolygon(from, polygons)
    );
  }

  /**
   * Whether a living unit (Legend, mob or boss) not on `team` covers `point` with its collider
   * circle: the test of `findUnitAt`, which picks the unit a click is on, on live entities. An
   * entity with no team counts as on no team, as in `findUnitAt`.
   */
  private static isEnemyUnitAt(
    entities: EntityStore,
    team: Team | undefined,
    point: Vec2,
  ): boolean {
    let isCovered = false;
    entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      if (
        isCovered ||
        transform === undefined ||
        !isUnitFamily(entity.family) ||
        entity.findComponent(TeamMembership)?.team === team ||
        !AreaHitQuery.isAlive(entity)
      ) {
        return;
      }
      const dx = transform.position.x - point.x;
      const dy = transform.position.y - point.y;
      // Squared distances: core keeps transcendental Math out (ADR 0012).
      isCovered = dx * dx + dy * dy <= transform.radius * transform.radius;
    });
    return isCovered;
  }

  /** Whether the entity has health left. */
  private static isAlive(entity: Entity): boolean {
    return entity.findComponent(Health)?.isDead === false;
  }

  /** Whether the entity is on `team`; an entity with no team is nobody's ally. */
  private static isAlly(entity: Entity, team: Team | undefined): boolean {
    const own = entity.findComponent(TeamMembership)?.team;
    return own !== undefined && own === team;
  }

  /** Whether the filter's team rule lets a body through. */
  private static passes({ team }: AreaFilter, isAlly: boolean): boolean {
    return team === 'all' || (team === 'allies') === isAlly;
  }
}
