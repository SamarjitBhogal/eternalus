import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { StatusEffectDefinition } from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';

/**
 * The one way a status reaches or leaves an entity (architecture 05 section 8): abilities, weapons,
 * projectiles and structures call `apply`, auras and holds call `remove`, `StatusEffectSystem`
 * calls `expire`. It emits every `status-applied` and `status-expired`. `DefaultSystemPipeline`
 * builds the match's one instance and hands it to the systems that need it.
 */
export class StatusEffectApplier {
  /** @param statuses - The loaded status effects (`loadStatusEffects`). */
  public constructor(private readonly statuses: ContentCatalogue<StatusEffectDefinition>) {}

  /**
   * Applies status `statusId` to `targetId`, credited to `sourceId`. Returns whether it landed: a
   * missing or dead target, or one without `StatusEffects` (a structure), is immune.
   *
   * @param durationTicks - The source's own duration for this application (a debuff step's
   *   `durationTicks`); the status's own duration when omitted.
   * @throws UnknownDefinitionError when no status has the id `statusId`.
   * @throws Error when `durationTicks` is given and is not a positive whole number of ticks.
   */
  public apply(
    state: GameState,
    targetId: EntityId,
    statusId: string,
    sourceId: EntityId | null,
    durationTicks?: number,
  ): boolean {
    if (durationTicks !== undefined && !(Number.isInteger(durationTicks) && durationTicks > 0)) {
      throw new Error(
        `A status duration must be a positive whole tick count, got ${String(durationTicks)}.`,
      );
    }
    const definition = this.statuses.get(statusId);
    const target = state.entities.get(targetId);
    const statuses = target?.findComponent(StatusEffects);
    if (
      target === undefined ||
      statuses === undefined ||
      target.findComponent(Health)?.isDead === true
    ) {
      return false;
    }
    statuses.apply(definition, sourceId, state.tick, durationTicks);
    state.events.emit('status-applied', { entityId: targetId, statusId, sourceId });
    return true;
  }

  /**
   * Ends status `statusId` on `targetId` now (an aura left, a hold released) and emits
   * `status-expired`. Returns whether it was active.
   */
  public remove(state: GameState, targetId: EntityId, statusId: string): boolean {
    const statuses = state.entities.get(targetId)?.findComponent(StatusEffects);
    const sourceId = statuses?.active.find((status) => status.definition.id === statusId)?.sourceId;
    if (statuses === undefined || sourceId === undefined || !statuses.remove(statusId)) {
      return false;
    }
    state.events.emit('status-expired', { entityId: targetId, statusId, sourceId });
    return true;
  }

  /** Removes every status on `targetId` that is over at `state.tick`, emitting `status-expired` for each, oldest first. */
  public expire(state: GameState, targetId: EntityId): void {
    const statuses = state.entities.get(targetId)?.findComponent(StatusEffects);
    if (statuses === undefined) {
      return;
    }
    for (const status of statuses.active) {
      if (status.hasExpired(state.tick)) {
        state.events.emit('status-expired', {
          entityId: targetId,
          statusId: status.definition.id,
          sourceId: status.sourceId,
        });
      }
    }
    statuses.expire(state.tick);
  }
}
