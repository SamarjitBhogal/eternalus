import { Abilities } from '../components/Abilities';
import type { Aim } from '../components/AbilitySlotRuntime.types';
import { ChaseWatch } from '../components/ChaseWatch';
import { Collider } from '../components/Collider';
import { Combat } from '../components/Combat';
import { ControllerBinding } from '../components/ControllerBinding';
import { Deploying } from '../components/Deploying';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { Movement } from '../components/Movement';
import type { Outline } from '../components/Outline.types';
import { StatusEffects } from '../components/StatusEffects';
import { TeamMembership } from '../components/TeamMembership';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { AttackMode } from '../content/units/units.types';
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
   * The outline attack reach to `id` is measured to, a chase of it aims at and a shot hits
   * (`ReachQuery`): its `MapObjectBody`, else its structure `Footprint` (a lane tower's fort, the
   * Stronghold's palace, DEC-185; a gate's outline, DEC-217 (17)). `undefined` for a body that is
   * only its collider circle, or an unknown id.
   */
  public outlineOf(id: EntityId): Outline | undefined {
    const entity = this.entities.get(id);
    return entity?.findComponent(MapObjectBody) ?? entity?.findComponent(Footprint);
  }

  /**
   * The entity's attack target (its lock, `Combat.targetId`), or `null` when it has none, cannot
   * attack or is unknown. It does not count aimed hits; `victimsOf` does.
   */
  public attackTargetOf(id: EntityId): EntityId | null {
    return this.entities.get(id)?.findComponent(Combat)?.targetId ?? null;
  }

  /**
   * Whom the entity attacks at `tick` (DEC-322 (2)): its lock, when it holds one, first; then each
   * other living body its last attack hit while the hits count (`Combat.hitsAt`). So a player who
   * aims, with no lock, attacks what it hits, and a locked sweep attacks every body it cut, not
   * only its lock. Empty when it attacks nothing, cannot attack or is unknown.
   */
  public victimsOf(id: EntityId, tick: number): readonly EntityId[] {
    const combat = this.entities.get(id)?.findComponent(Combat);
    if (combat === undefined) return [];
    const { targetId } = combat;
    const hits = combat.hitsAt(tick).filter((hitId) => hitId !== targetId && this.isAlive(hitId));
    return targetId === null ? hits : [targetId, ...hits];
  }

  /** Whether `attackerId` attacks `victimId` at `tick` (`victimsOf`). */
  public isAttacking(attackerId: EntityId, victimId: EntityId, tick: number): boolean {
    return this.victimsOf(attackerId, tick).includes(victimId);
  }

  /**
   * Records that an attack of `attackerId` touched `bodyIds` at `tick`, on its `Combat`
   * (`Combat.recordHits`, at its `attackSpeedOf`), so the AI sees whom it attacks (`victimsOf`,
   * DEC-322 (2)). The one place every contact point reports a hit: a sweep's bodies, a one-target
   * hit, a shot's body, an ability's targets. Does nothing for an attacker that is unknown, dead or
   * cannot attack.
   */
  public recordHits(attackerId: EntityId, bodyIds: readonly EntityId[], tick: number): void {
    const attacker = this.entities.get(attackerId);
    const combat = attacker?.findComponent(Combat);
    if (combat === undefined || bodyIds.length === 0) return;
    if (attacker?.findComponent(Health)?.isDead === true) return;
    combat.recordHits(bodyIds, tick, this.attackSpeedOf(attackerId));
  }

  /**
   * The entity's attack-speed multiplier from its statuses (0.7 concussed, 3 under Fury), 1 when it
   * has none or is unknown. The one read of it, for the cooldown (`CombatSystem`) and the hits.
   */
  public attackSpeedOf(id: EntityId): number {
    return this.entities.get(id)?.findComponent(StatusEffects)?.multiplier('attackSpeed') ?? 1;
  }

  /**
   * Whether the entity takes no damage now: its collider is unbreakable (a wall or gate before its
   * breakability rule passes, a forest camp). The one rule for it (DEC-333 (2)): the damage pipeline
   * blocks such a hit, and no weapon, shot or ability area lands on such a body (DEC-317 addendum).
   * `false` for an unknown entity or one with no collider.
   */
  public takesNoDamage(id: EntityId): boolean {
    return this.entities.get(id)?.findComponent(Collider)?.isUnbreakable === true;
  }

  /**
   * Clears the entity's attack target and aim point (`Combat.setTarget(null)` drops both); does
   * nothing when it cannot attack or is unknown.
   */
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
   * @param mode - Which attack to use (`'melee'` needs a melee attack).
   * @returns `false` when the entity is unknown or cannot attack (or has no melee for `'melee'`).
   */
  public setAttackTarget(id: EntityId, targetId: EntityId, mode: AttackMode = 'basic'): boolean {
    return this.entities.get(id)?.findComponent(Combat)?.setTarget(targetId, mode) ?? false;
  }

  /**
   * Points the entity's `Combat` at the world point `aim` (an aimed attack with no target, DEC-319),
   * dropping any target; `null` stops an aimed attack. Lets `commands/` set it without importing
   * `components/`, as `setAttackTarget` does.
   *
   * @param mode - Which attack to use (`'melee'` needs a melee attack).
   * @returns `false` when the entity is unknown or cannot attack (or has no melee for `'melee'`).
   */
  public setAttackAim(id: EntityId, aim: Vec2 | null, mode: AttackMode = 'basic'): boolean {
    return this.entities.get(id)?.findComponent(Combat)?.setAim(aim, mode) ?? false;
  }

  /**
   * Queues a checked cast on the entity's ability slot for `AbilitySystem` (05 §7). Lets
   * `commands/` queue a cast without importing `components/`, as `setAttackTarget` does.
   *
   * @returns `false` when the entity is unknown or has no such slot.
   */
  public queueCast(id: EntityId, slot: AbilitySlot, aim: Aim): boolean {
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
