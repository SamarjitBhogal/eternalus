import { Abilities } from '../components/Abilities';
import type { CastAim } from '../components/AbilitySlotRuntime.types';
import { Combat } from '../components/Combat';
import { ControllerBinding } from '../components/ControllerBinding';
import { Deploying } from '../components/Deploying';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { TeamMembership } from '../components/TeamMembership';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { Team } from '../teams/teams.types';
import { distanceToPath, distanceToSegment, isPointInPolygon } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import { length, sub } from '../utils/vec2';
import type { Entity } from '../entities/Entity';
import type { EntityClass, EntityId, RemovalCause, RemovalRecord } from './EntityStore.types';

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
   * two footprints (architecture 05 §10); a map object is measured to its footprint polygons, not
   * its bounding circle. `false` when either is unknown or the attacker cannot attack.
   */
  public isInReach(attackerId: EntityId, targetId: EntityId): boolean {
    const attacker = this.entities.get(attackerId);
    const target = this.entities.get(targetId);
    const combat = attacker?.findComponent(Combat);
    const from = attacker?.findComponent(Transform);
    const to = target?.findComponent(Transform);
    if (combat === undefined || from === undefined || to === undefined) {
      return false;
    }
    const object = target?.findComponent(MapObjectBody);
    if (object !== undefined) {
      const reach = from.radius + combat.attack.reach;
      return object.object.footprints.some((shape) => {
        const first = shape[0];
        const last = shape.at(-1);
        // A shape without corners is never in reach (`MapObjectBuilder` rejects one anyway).
        return (
          first !== undefined &&
          last !== undefined &&
          (isPointInPolygon(from.position, shape) ||
            Math.min(
              distanceToPath(from.position, shape),
              distanceToSegment(from.position, last, first),
            ) <= reach)
        );
      });
    }
    const gap = length(sub(to.position, from.position));
    return gap - from.radius - to.radius <= combat.attack.reach;
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
   * Queues a checked cast on the entity's ability slot for `AbilitySystem` (05 §7). Lets
   * `commands/` queue a cast without importing `components/`, as `setAttackTarget` does.
   *
   * @returns `false` when the entity is unknown or has no such slot.
   */
  public queueCast(id: EntityId, slot: AbilitySlot, aim: CastAim): boolean {
    const runtime = this.entities.get(id)?.findComponent(Abilities)?.slot(slot);
    if (runtime === undefined) {
      return false;
    }
    runtime.queue(aim);
    return true;
  }

  /** The slots of the entity's ability bar that hold an ability, in bar order; empty for an entity without a bar. */
  public filledSlotsOf(id: EntityId): readonly AbilitySlot[] {
    return (this.entities.get(id)?.findComponent(Abilities)?.slots ?? [])
      .filter(({ abilityId }) => abilityId !== null)
      .map(({ slot }) => slot);
  }

  /** Visits every entity in insertion order. Entities removed during the walk are skipped. */
  public forEach(visit: (entity: Entity) => void): void {
    this.entities.forEach((entity) => {
      visit(entity);
    });
  }
}
