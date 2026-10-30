import { Health } from '../components/Health';
import { Veterancy } from '../components/Veterancy';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { MOB_KINDS } from '../content/mobs/mobKinds';
import type { MinionVeterancyDefinition } from '../content/mobs/mobs.types';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/**
 * Minion XP (game doc, MVP-if-time; architecture 18 MS-16): a lane minion (a horde member) that
 * kills another lane minion counts the kill in its `Veterancy`; each level it earns raises its max health by
 * `healthPerLevel` of its base health (healing by the same) and adds a stack of the veteran
 * status. Every `aura.everySeconds`, each minion with a level gives the aura status to the other
 * friendly horde minions within `aura.radius`. Kills come from `entity-died`, counted on this
 * system's pass; it runs after every system that deals damage and before `DeathSystem`.
 */
export class VeterancySystem implements System {
  public readonly name = 'veterancy';
  private readonly kills: { readonly killerId: EntityId; readonly victimId: EntityId }[] = [];
  private readonly found: Int32Array;

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
    this.found = new Int32Array(state.config.limits.maxUnitsPerTeam * 2);
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

  private countKill(state: GameState, killerId: EntityId, victimId: EntityId): void {
    const killer = state.entities.get(killerId);
    // "A minion that kills another minion" (game doc): the victim must be a lane minion too,
    // still in its horde record this tick, so guards and camp mobs never count.
    const isMinionKill = state.hordes.hordeOf(victimId) !== undefined;
    if (
      killer === undefined ||
      !isMinionKill ||
      !state.entities.isAlive(killerId) ||
      state.hordes.hordeOf(killerId) === undefined
    ) {
      return;
    }
    let veterancy = killer.findComponent(Veterancy);
    if (veterancy === undefined) {
      veterancy = new Veterancy();
      killer.addComponent(veterancy);
    }
    const { killsPerLevel, maxLevel, healthPerLevel, statusId } = this.veterancy;
    if (!veterancy.recordKill(killsPerLevel, maxLevel)) {
      return;
    }
    const definition = this.units.get(killer.definitionId);
    const health = killer.findComponent(Health);
    if (!MOB_KINDS.has(definition) || health === undefined) {
      return;
    }
    const raise = definition.baseHealth * healthPerLevel;
    health.raiseMax(raise);
    health.heal(raise);
    this.statuses.apply(state, killerId, statusId, killerId);
  }

  private spreadAura(state: GameState): void {
    const space = state.space;
    if (space === null) {
      return;
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
          state.hordes.hordeOf(id) !== undefined
        ) {
          this.statuses.apply(state, id, statusId, entity.id);
        }
      }
    });
  }
}
