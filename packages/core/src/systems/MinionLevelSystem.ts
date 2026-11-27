import { Health } from '../components/Health';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { MOB_KINDS } from '../content/mobs/mobKinds';
import type { MinionVeterancyDefinition } from '../content/mobs/mobs.types';
import type { Entity } from '../entities/Entity';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';
import { veterancyOf } from './veterancyOf';

/** A queued level change: earned by kills (`sourceId` `null`) or granted by a zone. */
type LevelChange = {
  readonly entityId: EntityId;
  readonly levels: number;
  readonly sourceId: EntityId | null;
};

/**
 * Owns every minion level change (DEC-168: one level, every source; DEC-353 (a)). It queues
 * `minion-level-earned` (`VeterancySystem`, kills) and `minion-levels-granted`
 * (`ZoneLevelUpSystem`, 07 §7, DEC-258) and applies them on its own pass, so no listener changes
 * state in its handler (03 §4). Each level raises max health by `healthPerLevel` of base health
 * (healing by the same) and adds a veteran stack; each level lost lowers max health by the same
 * and takes a stack off. Runs after `ZoneLevelUpSystem`, so a lost zone takes its levels back on
 * the tick it is lost.
 */
export class MinionLevelSystem implements System {
  public readonly name = 'minion-level';
  private readonly changes: LevelChange[] = [];

  /**
   * @param state - The match whose level events this system listens to.
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
    state.events.on('minion-level-earned', ({ entityId }) => {
      this.changes.push({ entityId, levels: 1, sourceId: null });
    });
    state.events.on('minion-levels-granted', ({ entityId, levels, sourceId }) => {
      this.changes.push({ entityId, levels, sourceId });
    });
  }

  /** Applies this tick's level changes to the living minions, in the order they were announced. */
  public update({ state }: SystemContext): void {
    const { maxLevel } = this.veterancy;
    for (const { entityId, levels, sourceId } of this.changes.splice(0)) {
      const entity = state.entities.get(entityId);
      if (entity === undefined || !state.entities.isAlive(entityId)) {
        continue;
      }
      const veterancy = veterancyOf(entity);
      const change =
        sourceId === null
          ? veterancy.gainLevels(levels, maxLevel)
          : veterancy.grantLevels(levels, maxLevel, sourceId);
      this.applyLevelChange(state, entity, change);
    }
  }

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
    this.statuses.removeStacks(state, entity.id, statusId, -change);
  }
}
