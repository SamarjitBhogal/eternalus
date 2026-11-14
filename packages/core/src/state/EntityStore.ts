import { ChaseWatch } from '../components/ChaseWatch';
import { Combat } from '../components/Combat';
import { ControllerBinding } from '../components/ControllerBinding';
import { Deploying } from '../components/Deploying';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { TeamMembership } from '../components/TeamMembership';
import type { Team } from '../teams/teams.types';
import { distance, isPointInAnyPolygon, nearestPointOnPolygons } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { length, sub } from '../utils/vec2';
import type { MutableVec2 } from '../utils/vec2.types';
import type { Entity } from '../entities/Entity';
import type {
  AimedAt,
  EntityClass,
  EntityId,
  RemovalCause,
  RemovalRecord,
} from './EntityStore.types';

/**
 * Every live entity of a match, kept in insertion order. Systems iterate with `forEach`, so the
 * visiting order depends only on the order entities were added, never on hashing or timing.
 * The only way out is `remove(id, cause)`.
 */
export class EntityStore {
  private readonly entities = new Map<EntityId, Entity>();
  private readonly removals: RemovalRecord[] = [];
  private added = 0;
  private sizeAtStart = 0;
  /** Scratch for `isInReach`'s aim point. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /** Number of live entities. */
  public get size(): number {
    return this.entities.size;
  }

  /** Adds a spawned entity; its id must be new. */
  public add(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      throw new Error(`Entity "${entity.id}" is already in the store.`);
    }
    this.entities.set(entity.id, entity);
    this.added += 1;
  }

  /** The entity with `id`, or `undefined` if it is not (or no longer) in the world. */
  public get(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  /** Whether an entity with `id` is in the world. */
  public has(id: EntityId): boolean {
    return this.entities.has(id);
  }

  /** Retires the entity with `cause` and takes it out of the world. Unknown ids throw. */
  public remove(id: EntityId, cause: RemovalCause): Entity {
    const entity = this.entities.get(id);
    if (entity === undefined) {
      throw new Error(`Cannot remove unknown entity "${id}" (${cause}).`);
    }
    entity.retire(cause);
    this.entities.delete(id);
    this.removals.push({ entityId: id, cause });
    return entity;
  }

  /** Every removal of the current tick, in order (read by `NoRemovalWithoutCauseInvariant`). */
  public removedThisTick(): readonly RemovalRecord[] {
    return [...this.removals];
  }

  /** How many entities were added this tick. */
  public addedThisTick(): number {
    return this.added;
  }

  /** How many entities were in the store when this tick began. */
  public sizeAtTickStart(): number {
    return this.sizeAtStart;
  }

  /** Starts a new tick's bookkeeping. Called once per tick by `GameState.advanceTick()`. */
  public beginTick(): void {
    this.removals.length = 0;
    this.added = 0;
    this.sizeAtStart = this.entities.size;
  }

  /**
   * How many living instances of `entityClass` (e.g. `Unit`, `Legend`) fight for `team`. A unit
   * killed this tick is still stored until `DeathSystem` removes it, but no longer counts, so the
   * caps it frees can be filled in the same tick.
   */
  public countOnTeam(team: Team, entityClass: EntityClass): number {
    let total = 0;
    this.entities.forEach((entity) => {
      if (
        entity instanceof entityClass &&
        entity.findComponent(TeamMembership)?.team === team &&
        entity.findComponent(Health)?.isDead !== true
      ) {
        total += 1;
      }
    });
    return total;
  }

  /**
   * Points the entity's `Movement` along `direction` (zero to slow to a stop). Lets `commands/`
   * steer without importing `components/`, as `countOnTeam` reaches `TeamMembership`.
   *
   * @returns `false` when the entity is unknown or cannot move.
   */
  public steer(id: EntityId, direction: Vec2): boolean {
    const movement = this.entities.get(id)?.findComponent(Movement);
    if (movement === undefined) {
      return false;
    }
    movement.steer(direction);
    return true;
  }

  /** The entity's health as a fraction of its maximum, or `undefined` without `Health`. */
  public healthFractionOf(id: EntityId): number | undefined {
    const health = this.entities.get(id)?.findComponent(Health);
    return health === undefined ? undefined : health.current / health.max;
  }

  /**
   * Whether `targetId` is within `attackerId`'s attack reach, measured edge to edge between the
   * two footprints (architecture 05 §10) to the point `aimPointOf` gives: on the target's outline
   * when it has one (`outlineOf`: a map object, or a lane tower's fort, DEC-185), standing inside
   * an outline counting as in reach; else to its collider circle. `false` when either is unknown
   * or the attacker cannot attack.
   */
  public isInReach(attackerId: EntityId, targetId: EntityId): boolean {
    const attacker = this.entities.get(attackerId);
    const combat = attacker?.findComponent(Combat);
    const from = attacker?.findComponent(Transform);
    const to = this.entities.get(targetId)?.findComponent(Transform);
    if (combat === undefined || from === undefined || to === undefined) {
      return false;
    }
    const aimed = this.aimPointOf(targetId, from.position, this.aim);
    if (aimed === null) {
      return false;
    }
    if (aimed === 'centre') {
      const gap = length(sub(this.aim, from.position));
      return gap - from.radius - to.radius <= combat.attack.reach;
    }
    return distance(from.position, this.aim) <= from.radius + combat.attack.reach;
  }

  /**
   * The outlines attack reach to `id` is measured to and a chase of it aims at: its map object's
   * footprints, else its structure `Footprint`'s polygons (a lane tower's fort, the Stronghold's
   * palace, DEC-185; a gate's outline, DEC-217 (17)). `undefined` for a body that is only its
   * collider circle, or an unknown id.
   */
  public outlineOf(id: EntityId): readonly Polygon[] | undefined {
    const entity = this.entities.get(id);
    return (
      entity?.findComponent(MapObjectBody)?.object.footprints ??
      entity?.findComponent(Footprint)?.polygons
    );
  }

  /**
   * Writes into `out` the point of `targetId` that attack reach from `from` is measured to, which a
   * chase heads for (`StuckSystem`, `PathingSystem`): `from` itself when it stands inside the
   * target's outline (`outlineOf`), so it is in reach and a chase holds there (DEC-234); else the
   * point of the outline nearest `from`; else the target's centre (reach then also spans its
   * collider radius). A unit that damages a building from outside its outline can face this point
   * (DEC-216 (11)). Returns what it aimed at (`AimedAt`), so the inside test runs only here, or
   * `null`, leaving `out` as it was, when the target is unknown, has no position, or its outline
   * has no corners.
   */
  public aimPointOf(targetId: EntityId, from: Vec2, out: MutableVec2): AimedAt | null {
    const outline = this.outlineOf(targetId);
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
    const at = this.entities.get(targetId)?.findComponent(Transform)?.position;
    if (at === undefined) {
      return null;
    }
    out.x = at.x;
    out.y = at.y;
    return 'centre';
  }

  /** The entity's attack target, or `null` when it has none, cannot attack or is unknown. */
  public attackTargetOf(id: EntityId): EntityId | null {
    return this.entities.get(id)?.findComponent(Combat)?.targetId ?? null;
  }

  /** Clears the entity's attack target; does nothing when it cannot attack or is unknown. */
  public clearAttackTarget(id: EntityId): void {
    this.entities.get(id)?.findComponent(Combat)?.setTarget(null);
  }

  /** The entity's team, or `undefined` when it is unknown or has no team. */
  public teamOf(id: EntityId): Team | undefined {
    return this.entities.get(id)?.findComponent(TeamMembership)?.team;
  }

  /** The controller that drives the entity and its AI profile, or `undefined` when none does. */
  public controllerOf(id: EntityId): ControllerBinding | undefined {
    return this.entities.get(id)?.findComponent(ControllerBinding);
  }

  /**
   * Whether the entity is walking out of the structure it spawned inside (`Deploying`, DEC-133).
   * Lets `ai/` keep a deploying mob's brain off without importing `components/`.
   */
  public isDeploying(id: EntityId): boolean {
    return this.entities.get(id)?.hasComponent(Deploying) === true;
  }

  /**
   * Where the entity, stuck on its way to its attack target, heads to go round (`ChaseWatch`,
   * DEC-193); `null` when it is not detouring, has no waypoint, or is unknown.
   */
  public detourWaypointOf(id: EntityId): Vec2 | null {
    return this.entities.get(id)?.findComponent(ChaseWatch)?.waypoint ?? null;
  }

  /** Whether the entity exists and has health left (`false` for anything without `Health`). */
  public isAlive(id: EntityId): boolean {
    return this.entities.get(id)?.findComponent(Health)?.isDead === false;
  }

  /**
   * Points the entity's `Combat` at `targetId`. Lets `commands/` set a
   * target without importing `components/`, as `steer` does for movement.
   *
   * @returns `false` when the entity is unknown or cannot attack.
   */
  public setAttackTarget(id: EntityId, targetId: EntityId): boolean {
    const combat = this.entities.get(id)?.findComponent(Combat);
    if (combat === undefined) {
      return false;
    }
    combat.setTarget(targetId);
    return true;
  }

  /** Visits every entity in insertion order. Entities removed during the walk are skipped. */
  public forEach(visit: (entity: Entity) => void): void {
    this.entities.forEach((entity) => {
      visit(entity);
    });
  }
}
