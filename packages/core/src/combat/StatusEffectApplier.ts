import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { StatusEffectDefinition } from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';

/**
 * The one way a status reaches an entity (architecture 05 section 8): abilities, weapons,
 * projectiles and structures all call `apply`. Emits `status-applied` when it lands.
 */
export class StatusEffectApplier {
  /** @param statuses - The loaded status effects (`loadStatusEffects`, times in ticks). */
  public constructor(private readonly statuses: ContentCatalogue<StatusEffectDefinition>) {}

  /**
   * Applies status `statusId` to `targetId`, credited to `sourceId`. Returns whether it landed: a
   * missing or dead target, or one without `StatusEffects` (a structure), is immune.
   *
   * @throws UnknownDefinitionError when no status has the id `statusId`.
   */
  public apply(
    state: GameState,
    targetId: EntityId,
    statusId: string,
    sourceId: EntityId | null,
  ): boolean {
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
    statuses.apply(definition, sourceId, state.tick);
    state.events.emit('status-applied', { entityId: targetId, statusId, sourceId });
    return true;
  }
}
