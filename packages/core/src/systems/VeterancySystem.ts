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
 * tower guard (DEC-165) that kills a lane minion, a tower guard or a camp mob counts the kill in
 * its `Veterancy`; each level it gains raises its max health by `healthPerLevel` of its base
 * health (healing by the same) and adds a stack of the veteran status. Every `aura.everyTicks`,
 * each unit with a level gives the aura status to the other friendly horde minions and tower
 * guards (DEC-165) within `aura.radius`. Kills come from `entity-died`, counted on this system's
 * pass; it runs after every system that deals damage and before `DeathSystem`. Levels a held zone
 * grants or takes back (`minion-levels-granted`, 07 §7, DEC-258) are applied by its handler.
 */
export class VeterancySystem implements System {
  public readonly name = 'veterancy';
  private readonly kills: { readonly killerId: EntityId; readonly victimId: EntityId }[] = [];
  private found = new Int32Array(0);

  /**
   * @param state - The match whose deaths this system listens to.
   * @param statuses - The match's one status applier.
   * @param units - Unit definitions, for a minion's base health.
   * @param veterancy - The growth rules (content, loaded in ticks).
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
    // Applied as it is announced (an exception 03 §4 records): its sender, `ZoneLevelUpSystem`,
    // runs after this system, and a lost zone takes its levels back on the same tick (DEC-258).
    state.events.on('minion-levels-granted', ({ entityId, levels, sourceId }) => {
      const entity = state.entities.get(entityId);
      if (entity !== undefined && state.entities.isAlive(entityId)) {
        const veterancy = VeterancySystem.veterancyOf(entity);
        const { maxLevel } = this.veterancy;
        this.applyLevelChange(state, entity, veterancy.grantLevels(levels, maxLevel, sourceId));
      }
    });
  }

  /** Counts this tick's kills, then refreshes the aura on its cadence. */
  public update({ state }: SystemContext): void {
    for (const { killerId, victimId } of this.kills.splice(0)) {
      this.countKill(state, killerId, victimId);
    }
    if (state.tick % this.veterancy.aura.everyTicks === 0) {
      this.spreadAura(state);
    }
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
    if (VeterancySystem.veterancyOf(killer).recordKill(this.veterancy.killsPerLevel)) {
      this.gainLevels(state, killer, 1);
    }
  }

  /** Gives `entity` up to `levels` minion levels earned by kills, never past the cap. */
  private gainLevels(state: GameState, entity: Entity, levels: number): void {
    const gained = VeterancySystem.veterancyOf(entity).gainLevels(levels, this.veterancy.maxLevel);
    this.applyLevelChange(state, entity, gained);
  }

  /**
   * The effects of `entity`'s level moving by `change` (DEC-168: one level, every source): each
   * level raises max health by `healthPerLevel` of base health (healed by the same) and adds a
   * veteran stack; each level lost lowers max health by the same and leaves one stack per level.
   * Kills reach it from this system; other sources through `minion-levels-granted` (07 §7).
   */
  private applyLevelChange(state: GameState, entity: Entity, change: number): void {
    const definition = this.units.get(entity.definitionId);
    const health = entity.findComponent(Health);
    if (change === 0 || !MOB_KINDS.has(definition) || health === undefined) {
      return;
    }
    const step = definition.baseHealth * this.veterancy.healthPerLevel;
    const { statusId } = this.veterancy;
    if (change > 0) {
      for (let level = 0; level < change; level += 1) {
        health.raiseMaxAndHeal(step);
        this.statuses.apply(state, entity.id, statusId, entity.id);
      }
      return;
    }
    health.lowerMax(-change * step);
    // A status ends whole, so the stacks of the levels kept are put back.
    this.statuses.remove(state, entity.id, statusId);
    const { level } = VeterancySystem.veterancyOf(entity);
    for (let stack = 0; stack < level; stack += 1) {
      this.statuses.apply(state, entity.id, statusId, entity.id);
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
