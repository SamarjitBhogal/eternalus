import { Abilities } from '../components/Abilities';
import type { Entity } from '../entities/Entity';
import type { GameState } from './GameState';
import type { AbilitySlotSnapshot, PlayerSnapshot } from './Snapshot.types';
import type { SlotReadiness } from './SlotReadiness.types';

/**
 * Projects the human's Legend into its `PlayerSnapshot` (architecture 05 §15, DEC-232): the data
 * only the player needs, which `EntitySnapshotter` does not carry. A new player-only group is added
 * here, never in `GameState`.
 */
export class PlayerSnapshotter {
  /** @param readiness - The cast rules the slots are judged by (the match's `CastValidator`). */
  public constructor(private readonly readiness: SlotReadiness) {}

  /** The player's slots, or `null` when `legend` has no ability bar. */
  public snapshotOf(state: GameState, legend: Entity): PlayerSnapshot | null {
    const abilities = legend.findComponent(Abilities);
    if (abilities === undefined) {
      return null;
    }
    const slots: AbilitySlotSnapshot[] = abilities.slots.map((runtime) => {
      const { abilityId, slot } = runtime;
      // The slot's own state decides readiness; the aim is the cast's, not the slot's.
      const blockedBy = this.readiness.slotBlockedBy(state, legend.id, slot);
      return {
        slot,
        abilityId,
        cooldownRemainingTicks: runtime.cooldownRemaining(state.tick),
        cooldownTicks: abilityId === null ? 0 : this.readiness.cooldownTicksOf(abilityId),
        aetherCost: abilityId === null ? 0 : this.readiness.priceOf(state, legend.id, abilityId),
        // ponytail: the ultimate meter is built with Fury (phase 4); until then no slot reports one.
        charge: null,
        isReady: blockedBy === null,
        blockedBy,
      };
    });
    return { entityId: legend.id, slots };
  }
}
