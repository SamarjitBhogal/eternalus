import { Health } from '../components/Health';
import type { Outline } from '../components/Outline.types';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import { isUnitFamily, UNIT_FAMILIES } from '../entities/unitFamilies';
import type { Team } from '../teams/teams.types';
import { compareById } from '../utils/compareById';
import { isPointInAnyPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type {
  AreaAim,
  AreaAttacker,
  AreaFilter,
  HitArea,
  ShotAim,
  ShotStopBody,
} from './AreaHitQuery.types';
import type { EntityStore } from './EntityStore';
import type { EntityId } from './EntityStore.types';

/**
 * The one hit rule for weapon areas and ability areas (DEC-322 (3)): which live bodies an area
 * touches. The weapon sweep, a shot's blast (`WeaponImpact`, DEC-342) and the abilities'
 * `TargetQuery` hand it their area as a `HitArea`. It walks the live bodies with a `Transform` and
 * `Health`, filters them by team relative to the attacker (and by family, when the filter names
 * families), and tests each one against the area. A body with an outline (`EntityStore.outlineOf`:
 * a map object, a structure footprint) is tested by its polygons; any other body by its collider
 * circle. Then two rules apply:
 *
 * 1. A walk-on polygon (a palace floor, a gate's passage) is hit only when the hit aims at its
 *    body (DEC-322 (1)): the body is the locked target, or the aim point is on its walk-on
 *    polygons, on no enemy unit (the rule of `findUnitAt`) and the attacker stands outside them. A
 *    solid polygon is hit by every hit that touches it. The palace floor is the palace map
 *    object's, not the Stronghold's (DEC-344 (4)): from outside, aiming at it hits the palace
 *    object; from inside, it is not hit. A swing that touches the Stronghold's outer walls or its
 *    throne hits the Stronghold (solid, DEC-386 (1)).
 * 2. A body that takes no damage now (`EntityStore.takesNoDamage`) is never hit: it takes no
 *    damage and runs no on-hit step (DEC-317 addendum). A shot stops on it (`ProjectileSystem`).
 *
 * It also holds the one rule for which bodies stop a shot (`stopsShot`, `shotPolygonsOf`), which
 * `ProjectileSystem` flies shots by and `LineOfFire` predicts them by. A shot not aimed at a body
 * flies over more polygons than a swing passes: also the solid polygons shots cross
 * (`Outline.shotsCross`: a camp fire is not walked on, but a shot flies over it, HC-Q105). Ids come
 * back in `compareById` order, so every run hits in the same order. Stateless.
 *
 * ponytail: a walk over the store, not the `SpatialHash`, O(entities) per area. Only Legends
 * sweep and casts are rare. Ceiling: many sweepers (mob weapons); upgrade to a `SpatialHash`
 * query then.
 */
export class AreaHitQuery {
  /**
   * The unit families (`entities/unitFamilies`), so a layer that may not import `entities/`
   * (`combat/`, architecture 02) can ask for units only: `{ families: AreaHitQuery.UNIT_FAMILIES }`.
   */
  public static readonly UNIT_FAMILIES: readonly string[] = UNIT_FAMILIES;

  /**
   * Whether `shot` stops on `body` when it touches it (DEC-317 addendum, DEC-322 (1)): the body is
   * alive and still in the world, not the shot's owner and not on its team (no team counts as
   * enemy), and the shot can touch it: for an outline, it has a polygon that stops the shot
   * (`shotPolygonsOf`); for a body that is only its collider circle, its collider does not let
   * shots fly over (`Collider.canShotsFlyOver`: a forest camp's home, HC-Q115) or the shot aims at
   * it (`shot.targetId`). So a shot not aimed at the body flies over the ground units stand on, a
   * camp fire and a forest camp's home (HC-Q105), and stops on the Stronghold's outer walls and
   * throne (Q104-9). A body that takes no damage now (`EntityStore.takesNoDamage`) stops it too,
   * and nothing lands on it. The one rule by which `ProjectileSystem` flies a shot and
   * `LineOfFire` predicts it.
   */
  public static stopsShot(entities: EntityStore, shot: ShotAim, body: ShotStopBody): boolean {
    const { entity, health, membership, outline, collider } = body;
    return (
      !health.isDead &&
      entity.id !== shot.ownerId &&
      membership?.team !== shot.team &&
      (outline === null
        ? collider?.canShotsFlyOver !== true || entity.id === shot.targetId
        : AreaHitQuery.shotPolygonsOf(shot, body).length > 0) &&
      entities.has(entity.id)
    );
  }

  /**
   * The polygons of `body`'s outline that `shot` can touch it on (DEC-322 (1)): every one when the
   * shot aims at the body (`shot.targetId`), else every one that the shot does not fly over
   * (`flownOverPolygonsOf`). None for a body that is only its collider circle.
   */
  public static shotPolygonsOf(
    shot: ShotAim,
    { entity, outline }: ShotStopBody,
  ): readonly Polygon[] {
    if (outline === null) return [];
    if (entity.id === shot.targetId) return outline.polygons;
    const flownOver = AreaHitQuery.flownOverPolygonsOf(outline);
    return outline.polygons.filter((polygon) => !flownOver.includes(polygon));
  }

  /**
   * The ids of the live bodies that `area` touches and `filter` lets through for `attackerId`,
   * under rules 1 and 2, sorted by id.
   *
   * @param aim - What the hit aims at; a walk-on outline needs it (rule 1).
   * @param attacker - The attacker's team and position; absent, the store's. A cast whose caster
   *   may be gone passes its own (`CastFacts.caster`), and a shot's blast its shot's team and
   *   origin (`WeaponImpact`), so their enemies stay their team's enemies.
   */
  public find(
    entities: EntityStore,
    attackerId: EntityId,
    area: HitArea,
    aim: AreaAim,
    filter: AreaFilter,
    { team: attackerTeam, position: from }: AreaAttacker = AreaHitQuery.attackerIn(
      entities,
      attackerId,
    ),
  ): EntityId[] {
    const hits: EntityId[] = [];
    entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      if (
        transform === undefined ||
        !AreaHitQuery.isAlive(entity) ||
        (entity.id === attackerId && filter.includeSelf !== true) ||
        (filter.families !== undefined && !filter.families.includes(entity.family)) ||
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
      const isAimed =
        aim.targetId === id ||
        (aim.point !== null &&
          outline.walkOn.length > 0 &&
          AreaHitQuery.isAimedByPoint(entities, attackerTeam, outline.walkOn, aim.point, from));
      const body = { id, position: transform.position };
      if (
        AreaHitQuery.hitPolygonsOf(outline, isAimed).some((polygon) =>
          area.overlapsOutline(polygon, body),
        )
      ) {
        hits.push(id);
      }
    });
    return hits.sort(compareById);
  }

  /**
   * The body that `attackerId` aims at with `point` under rule 1, on a polygon that a shot not
   * aimed at the body flies over (`flownOverPolygonsOf`: a walk-on floor, a camp fire). Its shot
   * then names the body as its target (`ProjectilePayload.targetId`), so the shot can hit it. Only
   * `RangedProjectileAttackStrategy` asks it, so it reads the shot rule's polygons, not only the
   * walk-on ones. A solid polygon that stops every shot (the Stronghold's outer walls) does not
   * name its body: the shot stops there anyway. Only enemy bodies (no team counts as enemy). When
   * several such outlines hold the point (a gate's passage is both the gate's outline and the gate
   * map object's), a structure comes first, then the first by id, so a shot at the gate names the
   * gate. A sweep still hits both (DEC-284 (2)). The palace floor is only the palace map object's
   * (DEC-344 (4)).
   *
   * @returns The body's id, or `null` when the point is on no such outline, on an enemy unit, or
   *   the attacker stands inside the outline or is unknown.
   */
  public aimedBodyOf(entities: EntityStore, attackerId: EntityId, point: Vec2): EntityId | null {
    const { team: attackerTeam, position: from } = AreaHitQuery.attackerIn(entities, attackerId);
    const aimed: EntityId[] = [];
    entities.forEach((entity) => {
      const outline = entities.outlineOf(entity.id);
      const crossed = outline === undefined ? [] : AreaHitQuery.flownOverPolygonsOf(outline);
      if (
        crossed.length > 0 &&
        entity.hasComponent(Transform) &&
        AreaHitQuery.isAlive(entity) &&
        !AreaHitQuery.isAlly(entity, attackerTeam) &&
        AreaHitQuery.isOnOutlineFromOutside(crossed, point, from)
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

  /**
   * The polygons of `outline` that a shot not aimed at its body flies over, the one statement of
   * that rule: the walk-on ones (a palace floor, a gate's passage, DEC-322 (1)) and the solid ones
   * that shots cross (`Outline.shotsCross`: a camp fire's body, HC-Q105, Q104-9). Every other
   * polygon stops such a shot (a fort, the Stronghold's outer walls and throne, DEC-386 (1)).
   * `shotPolygonsOf` drops them and `aimedBodyOf` names a body by them. They are the same polygon
   * objects as in `outline.polygons` (the `Outline` contract), so a drop by identity is exact.
   */
  private static flownOverPolygonsOf(outline: Outline): readonly Polygon[] {
    return [...outline.walkOn, ...outline.shotsCross];
  }

  /**
   * The polygons of `outline` a hit can land on (rule 1): every one when the hit aims at the body,
   * else only the solid ones, so it passes over a walk-on floor.
   */
  private static hitPolygonsOf(outline: Outline, isAimed: boolean): readonly Polygon[] {
    return isAimed ? outline.polygons : outline.solid;
  }

  /** The attacker's team and position as the store holds them now; both absent once it is gone. */
  private static attackerIn(entities: EntityStore, attackerId: EntityId): AreaAttacker {
    return {
      team: entities.teamOf(attackerId),
      position: entities.get(attackerId)?.findComponent(Transform)?.position,
    };
  }

  /**
   * Rule 1 by aim point: on the walk-on polygons, the attacker outside them, and on no enemy unit.
   */
  private static isAimedByPoint(
    entities: EntityStore,
    attackerTeam: Team | undefined,
    walkOn: readonly Polygon[],
    point: Vec2,
    from: Vec2 | undefined,
  ): boolean {
    return (
      AreaHitQuery.isOnOutlineFromOutside(walkOn, point, from) &&
      !AreaHitQuery.isEnemyUnitAt(entities, attackerTeam, point)
    );
  }

  /** Whether `point` is on the polygons and `from` (the attacker) is known and outside them. */
  private static isOnOutlineFromOutside(
    polygons: readonly Polygon[],
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
