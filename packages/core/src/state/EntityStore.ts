import { Brain } from '../components/Brain';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
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

  /** How many live instances of `entityClass` (e.g. `Unit`, `Legend`) fight for `team`. */
  public countOnTeam(team: Team, entityClass: EntityClass): number {
    let total = 0;
    this.entities.forEach((entity) => {
      if (entity instanceof entityClass && entity.findComponent(TeamMembership)?.team === team) {
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
   * The entity's live position, for `ai/`, which may not import `components/`. Read it, do not
   * keep it: it changes as the entity moves.
   */
  public positionOf(id: EntityId): Vec2 | undefined {
    return this.entities.get(id)?.findComponent(Transform)?.position;
  }

  /** The entity's team, or `undefined` when it is unknown or has no team. */
  public teamOf(id: EntityId): Team | undefined {
    return this.entities.get(id)?.findComponent(TeamMembership)?.team;
  }

  /** The id of the controller that drives the entity, or `undefined` when nothing does. */
  public controllerOf(id: EntityId): string | undefined {
    return this.entities.get(id)?.findComponent(Brain)?.controllerId;
  }

  /** Visits every entity in insertion order. Entities removed during the walk are skipped. */
  public forEach(visit: (entity: Entity) => void): void {
    this.entities.forEach((entity) => {
      visit(entity);
    });
  }
}
