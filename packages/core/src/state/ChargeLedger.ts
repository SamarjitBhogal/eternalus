import { ULTIMATE_SLOT } from '../components/Abilities.constants';
import type { EntityId } from './EntityStore.types';
import type { GameEvents } from './GameEvents';

/**
 * The ultimate charge each entity was last announced to hold (architecture 05 §16): set from each
 * `ultimate-charged`, emptied by an ultimate's `ability-cast` (a cast empties the meter) and
 * dropped at `entity-removed`. `UltimateNeverFillsPassivelyInvariant` compares it with the
 * meters, so a write that skips the announcement shows. Kept here, outside the hashed state,
 * because an invariant's check reads the state and never listens.
 */
export class ChargeLedger {
  private readonly announced = new Map<EntityId, number>();

  /**
   * Subscribes to `events`; lives as long as the match.
   *
   * @param events - The channel the meter's changes, casts and removals arrive on.
   */
  public constructor(events: GameEvents) {
    events.on('ultimate-charged', ({ entityId, charge }) => {
      this.announced.set(entityId, charge);
    });
    events.on('ability-cast', ({ casterId, slot }) => {
      if (slot === ULTIMATE_SLOT) {
        this.announced.set(casterId, 0);
      }
    });
    events.on('entity-removed', ({ entityId }) => {
      this.announced.delete(entityId);
    });
  }

  /** The charge last announced for `entityId`: 0 before its first change and after a cast. */
  public announcedChargeOf(entityId: EntityId): number {
    return this.announced.get(entityId) ?? 0;
  }
}
