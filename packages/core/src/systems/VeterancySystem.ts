import { Veterancy } from '../components/Veterancy';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { MinionVeterancyDefinition } from '../content/mobs/mobs.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';
import { veterancyOf } from './veterancyOf';

/**
 * Minion XP (game doc, MVP-if-time; architecture 18 MS-16): a lane minion (a horde member) or a
 * guard whose plan can level (tower guards, DEC-165; forest-camp mobs and checkpoint defenders,
 * DEC-260; the capture point boss group, DEC-350) that kills a lane minion, a tower guard or a camp
 * mob counts the kill in its `Veterancy`; every `killsPerLevel`-th kill announces a level
 * (`minion-level-earned`), which `MinionLevelSystem` applies with its effects (DEC-353 (a)). Every
 * `aura.everyTicks`, each unit with a level gives the aura status to the other friendly levellers
 * within `aura.radius`. Kills come from `entity-died`, counted on this system's pass; it runs after
 * every system that deals damage and before `DeathSystem`.
 */
export class VeterancySystem implements System {
  public readonly name = 'veterancy';
  private readonly kills: { readonly killerId: EntityId; readonly victimId: EntityId }[] = [];
  private found = new Int32Array(0);

  /**
   * @param state - The match whose deaths this system listens to.
   * @param statuses - The match's one status applier (the aura).
   * @param veterancy - The growth rules (content, loaded in ticks).
   */
  public constructor(
    state: GameState,
    private readonly statuses: StatusEffectApplier,
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
    if (veterancyOf(killer).recordKill(this.veterancy.killsPerLevel)) {
      state.events.emit('minion-level-earned', { entityId: killerId });
    }
  }

  /**
   * Lane minions level from their kills and are rallied by the aura, and so does a guard whose
   * post's plan says it can (`canLevel`: tower guards, DEC-165; forest-camp mobs and checkpoint
   * defenders, DEC-260; the capture point boss group, DEC-350; the corner boss, DEC-402).
   */
  private static isLeveller(state: GameState, id: EntityId): boolean {
    return state.hordes.hordeOf(id) !== undefined || state.guards.slotOf(id)?.canLevel === true;
  }

  /** DEC-165: a lane minion, tower guard or camp mob counts as a kill for a leveller that kills it. */
  private static countsAsKill(state: GameState, id: EntityId): boolean {
    return state.hordes.hordeOf(id) !== undefined || state.guards.slotOf(id) !== undefined;
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
