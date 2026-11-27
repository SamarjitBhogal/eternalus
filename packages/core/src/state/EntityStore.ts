import { BossMoveCast } from '../components/BossMoveCast';
import { ChaseWatch } from '../components/ChaseWatch';
import { Combat } from '../components/Combat';
import { CombatHitbox } from '../components/CombatHitbox';
import { ControllerBinding } from '../components/ControllerBinding';
import { Deploying } from '../components/Deploying';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { Jump } from '../components/Jump';
import { MapObjectBody } from '../components/MapObjectBody';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { TeamMembership } from '../components/TeamMembership';
import type { Team } from '../teams/teams.types';
import { distance, isPointInAnyPolygon, nearestPointOnPolygons } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
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
 * The only ways out are `remove(id, cause)` and, for an entity that comes back,
 * `withdraw(id, cause)`.
 */
export class EntityStore {
  private readonly entities = new Map<EntityId, Entity>();
  private readonly removals: RemovalRecord[] = [];
  private added = 0;
  private sizeAtStart = 0;
  /** Scratch for `isInReach`: the aim point, then the nearest point on a big boss's body. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /** Number of live entities. */
  public get size(): number {
    return this.entities.size;
  }

  /**
   * Adds a spawned entity, or a withdrawn one coming back (`withdraw`); its id must not be in the
   * store.
   */
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

  /**
   * Takes the entity with `id` out of the world with `cause` without retiring it: it keeps its
   * components, so the same object can be added back later (a dead Legend waiting to respawn,
   * FR-051, DEC-295). It counts as a removal of this tick, as `remove` does. Unknown ids throw.
   */
  public withdraw(id: EntityId, cause: RemovalCause): Entity {
    const entity = this.entities.get(id);
    if (entity === undefined) {
      throw new Error(`Cannot withdraw unknown entity "${id}" (${cause}).`);
    }
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

  /**
   * Records whether the entity's jump key is held (`Jump`, DEC-390). Lets `commands/` jump
   * without importing `components/`, as `steer` does for movement.
   *
   * @returns `false` when the entity is unknown or cannot jump.
   */
  public holdJump(id: EntityId, isHeld: boolean): boolean {
    const jump = this.entities.get(id)?.findComponent(Jump);
    if (jump === undefined) {
      return false;
    }
    jump.hold(isHeld);
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
   * when it has one (`outlineOf`: a map object, a lane tower's fort, DEC-185, or a big boss's
   * body, DEC-381), standing inside an outline counting as in reach; else to its collider circle.
   * A big boss reaches a unit from its whole drawn body (`gapPastEdgeOf`, DEC-421).
   * `false` when either is unknown, either has no `Transform`, or the attacker cannot attack.
   */
  public isInReach(attackerId: EntityId, targetId: EntityId): boolean {
    const attacker = this.entities.get(attackerId);
    const combat = attacker?.findComponent(Combat);
    const from = attacker?.findComponent(Transform);
    const to = this.entities.get(targetId)?.findComponent(Transform);
    if (attacker === undefined || combat === undefined || from === undefined || to === undefined) {
      return false;
    }
    const aimed = this.aimPointOf(targetId, from.position, this.aim);
    if (aimed === null) {
      return false;
    }
    if (aimed === 'centre') {
      return this.gapPastEdgeOf(attacker, from, to.position) - to.radius <= combat.attack.reach;
    }
    // ponytail: a big boss still reaches an outlined target (a building) from its circle; guards
    // only take units (`LeashBehaviour` acquires through `unitsWithin`). Upgrade: an outline-to-
    // outline gap when a unit with a body shape can attack a building.
    return distance(from.position, this.aim) <= from.radius + combat.attack.reach;
  }

  /**
   * How far `point` lies past the attacker's edge, where its attack reach starts: its drawn body
   * outline when it has one (`CombatHitbox`: a big boss hits from its whole body, DEC-421), 0
   * inside the outline; else its collider circle, negative inside the circle.
   */
  private gapPastEdgeOf(attacker: Entity, from: Transform, point: Vec2): number {
    const hitbox = attacker.findComponent(CombatHitbox);
    if (hitbox === undefined) {
      return distance(from.position, point) - from.radius;
    }
    // ponytail: a new world polygon on each call, as `outlineOf` (see its note).
    const body = [hitbox.polygonAt(from.position, from.facing)];
    return isPointInAnyPolygon(point, body) ? 0 : nearestPointOnPolygons(point, body, this.aim);
  }

  /**
   * The outlines attack reach to `id` is measured to and a chase of it aims at: a big boss's body
   * outline where it stands now (`CombatHitbox`, DEC-381), else its map object's footprints, else
   * its structure `Footprint`'s polygons (a lane tower's fort, the Stronghold's palace, DEC-185; a
   * gate's outline, DEC-217 (17)). `undefined` for a body that is only its collider circle, a body
   * shape with no `Transform`, or an unknown id.
   */
  public outlineOf(id: EntityId): readonly Polygon[] | undefined {
    const entity = this.entities.get(id);
    if (entity === undefined) return undefined;
    const hitbox = entity.findComponent(CombatHitbox);
    const transform = entity.findComponent(Transform);
    if (hitbox !== undefined && transform !== undefined) {
      // ponytail: a new world polygon on each call (a few a tick per attacker of a big boss); 08 §9
      // says profile first. Upgrade: keep one polygon per CombatHitbox, rebuilt when it moves.
      return [hitbox.polygonAt(transform.position, transform.facing)];
    }
    return (
      entity.findComponent(MapObjectBody)?.object.footprints ??
      entity.findComponent(Footprint)?.polygons
    );
  }

  /**
   * Writes into `out` the point of `targetId` that attack reach from `from` is measured to, which a
   * chase heads for (`StuckSystem`, `PathingSystem`): `from` itself when it stands inside the
   * target's outline (`outlineOf`), so it is in reach and a chase holds there (DEC-234); else the
   * point of the outline nearest `from`; else the target's centre (reach then also spans its
   * collider radius). An attacker outside the outline faces this point (`facingPointOf`, DEC-216
   * (11)). Returns what it aimed at (`AimedAt`), so the inside test runs only here, or
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

  /**
   * Writes into `out` the point `attackerId` faces while it attacks `targetId`: the aim point
   * (`aimPointOf`, DEC-216 (11)), except that an attacker standing inside the target's outline,
   * whose aim point is where it stands (DEC-234), faces the target's centre (DEC-220 (1)). A
   * fort's court is outside its outline, so a unit there faces the aim point (DEC-226). Reach and
   * chase keep `aimPointOf`. `false`, leaving `out` as it was, when either has no position or the
   * target has no aim point.
   */
  public facingPointOf(attackerId: EntityId, targetId: EntityId, out: MutableVec2): boolean {
    const from = this.entities.get(attackerId)?.findComponent(Transform)?.position;
    const centre = this.entities.get(targetId)?.findComponent(Transform)?.position;
    if (from === undefined || centre === undefined) {
      return false;
    }
    const aimed = this.aimPointOf(targetId, from, out);
    if (aimed === 'inside') {
      out.x = centre.x;
      out.y = centre.y;
    }
    return aimed !== null;
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

  /**
   * Starts the boss's move `moveId`, to land on `landTick` (`BossMoveCast`). Lets `commands/` start
   * one without importing `components/`, as `steer` does for movement.
   */
  public beginBossMove(id: EntityId, moveId: string, landTick: number): void {
    const entity = this.entities.get(id);
    if (entity === undefined) {
      return;
    }
    let cast = entity.findComponent(BossMoveCast);
    if (cast === undefined) {
      cast = new BossMoveCast();
      entity.addComponent(cast);
    }
    cast.begin(moveId, landTick);
  }

  /** Visits every entity in insertion order. Entities removed during the walk are skipped. */
  public forEach(visit: (entity: Entity) => void): void {
    this.entities.forEach((entity) => {
      visit(entity);
    });
  }
}
