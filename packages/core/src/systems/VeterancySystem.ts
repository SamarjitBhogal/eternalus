import { Health } from '../components/Health';
import { Veterancy } from '../components/Veterancy';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { MOB_KINDS } from '../content/mobs/mobKinds';
import type { MinionVeterancyDefinition } from '../content/mobs/mobs.types';
import type { Entity } from '../entities/Entity';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/**
 * Minion XP (game doc, MVP-if-time; architecture 18 MS-16): a lane minion (a horde member) or a
 * tower guard (DEC-165) that kills a lane minion or a tower guard counts the kill in its
 * `Veterancy`; each level it gains (`gainLevels`) raises its max health by `healthPerLevel` of its
 * base health (healing by the same) and adds a stack of the veteran status. Every
 * `aura.everySeconds`, each unit with a level gives the aura status to the other friendly horde
 * minions and tower guards (DEC-165) within `aura.radius`. Kills come from `entity-died`, counted
 * on this system's pass; it runs after every system that deals damage and
 * before `DeathSystem`.
 */
export class VeterancySystem implements System {
  public readonly name = 'veterancy';
  private readonly kills: { readonly killerId: EntityId; readonly victimId: EntityId }[] = [];
  private found = new Int32Array(0);

  /**
   * @param state - The match whose deaths this system listens to.
   * @param statuses - The match's one status applier.
   * @param units - Unit definitions, for a minion's base health.
   * @param veterancy - The growth rules (content).
   */
  public constructor(
    state: GameState,
    private readonly statuses: StatusEffectApplier,
    private readonly units: DefinitionSource,
    private readonly veterancy: MinionVeterancyDefinition,
  ) {
    state.events.on('entity-died', ({ entityId, killer }) => {
      if (killer.attackerId !== null) {
        this.kills.push({ killerId: killer.attackerId, victimId: entityId });
      }
    });
  }

  /** Counts this tick's kills, then refreshes the aura on its cadence. */
  public update({ state }: SystemContext): void {
    for (const { killerId, victimId } of this.kills.splice(0)) {
      this.countKill(state, killerId, victimId);
    }
    const every = Math.max(1, Math.round(this.veterancy.aura.everySeconds * state.config.tickRate));
    if (state.tick % every === 0) {
      this.spreadAura(state);
    }
  }

  /**
   * Gives `entityId` up to `levels` minion levels, never past the cap, each with its effects: max
   * health `healthPerLevel` of base health higher (healed by the same) and a veteran stack. The one
   * way in for every level source (DEC-168): this system's kills, and the zone level-up
   * (balancing.md "+1 minion level (max 3)") once capture points emit it. Returns the levels gained.
   */
  public gainLevels(state: GameState, entityId: EntityId, levels: number): number {
    const entity = state.entities.get(entityId);
    if (entity === undefined || !state.entities.isAlive(entityId)) {
      return 0;
    }
    const gained = VeterancySystem.veterancyOf(entity).gainLevels(levels, this.veterancy.maxLevel);
    this.applyLevels(state, entity, gained);
    return gained;
  }

  private countKill(state: GameState, killerId: EntityId, victimId: EntityId): void {
    const killer = state.entities.get(killerId);
    // "A minion that kills another minion" (game doc); DEC-165: the victim must be a lane minion
    // still in its horde record this tick, or a tower guard or camp mob still on its post
    // ("killing a guard is a kill"; camp mobs too, owner 2026-11-04).
    if (
      killer === undefined ||
      !VeterancySystem.countsAsKill(state, victimId) ||
      !state.entities.isAlive(killerId) ||
      !VeterancySystem.isLeveller(state, killerId)
    ) {
      return;
    }
    const { killsPerLevel, maxLevel } = this.veterancy;
    if (VeterancySystem.veterancyOf(killer).recordKill(killsPerLevel, maxLevel)) {
      this.applyLevels(state, killer, 1);
    }
  }

  private applyLevels(state: GameState, entity: Entity, levels: number): void {
    const definition = this.units.get(entity.definitionId);
    const health = entity.findComponent(Health);
    if (!MOB_KINDS.has(definition) || health === undefined) {
      return;
    }
    for (let level = 0; level < levels; level += 1) {
      health.raiseMaxAndHeal(definition.baseHealth * this.veterancy.healthPerLevel);
      this.statuses.apply(state, entity.id, this.veterancy.statusId, entity.id);
    }
  }

  /**
   * DEC-165: lane minions and tower guards level from their kills and are rallied by the aura;
   * camp mobs (neutral posts) do neither.
   */
  private static isLeveller(state: GameState, id: EntityId): boolean {
    const post = state.guards.slotOf(id);
    return (
      state.hordes.hordeOf(id) !== undefined || (post !== undefined && post.team !== 'neutral')
    );
  }

  /** DEC-165: a lane minion, tower guard or camp mob counts as a kill for a leveller that kills it. */
  private static countsAsKill(state: GameState, id: EntityId): boolean {
    return state.hordes.hordeOf(id) !== undefined || state.guards.slotOf(id) !== undefined;
  }

  private static veterancyOf(entity: Entity): Veterancy {
    const found = entity.findComponent(Veterancy);
    if (found !== undefined) {
      return found;
    }
    const veterancy = new Veterancy();
    entity.addComponent(veterancy);
    return veterancy;
  }

  private spreadAura(state: GameState): void {
    const space = state.space;
    if (space === null) {
      return;
    }
    // Room for every indexed unit, as `Perception` sizes its buffer: a query never drops one.
    if (this.found.length < space.count) {
      this.found = new Int32Array(Math.max(space.count, 2 * this.found.length));
    }
    const { statusId, radius } = this.veterancy.aura;
    state.entities.forEach((entity) => {
      const index = space.indexOf(entity.id);
      const team = state.entities.teamOf(entity.id);
      if (
        (entity.findComponent(Veterancy)?.level ?? 0) === 0 ||
        index === undefined ||
        !state.entities.isAlive(entity.id)
      ) {
        return;
      }
      const x = space.positions[2 * index] ?? 0;
      const y = space.positions[2 * index + 1] ?? 0;
      const count = space.queryCircle(x, y, radius, this.found);
      for (let at = 0; at < count; at += 1) {
        const id = space.idAt(this.found[at] ?? index);
        if (
          id !== entity.id &&
          state.entities.teamOf(id) === team &&
          VeterancySystem.isLeveller(state, id)
        ) {
          this.statuses.apply(state, id, statusId, entity.id);
        }
      }
    });
  }
}
