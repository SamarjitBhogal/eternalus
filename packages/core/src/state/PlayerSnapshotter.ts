import { Abilities } from '../components/Abilities';
import { StatusEffects } from '../components/StatusEffects';
import { ULTIMATE_SLOT } from '../components/Abilities.constants';
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
      const isRecast = runtime.isRecastActive(state.tick, legend.findComponent(StatusEffects));
      const cooldown = abilityId === null ? 0 : this.readiness.cooldownTicksOf(abilityId);
      return {
        slot,
        abilityId,
        cooldownRemainingTicks: isRecast
          ? runtime.cooldownRemaining(state.tick)
          : Math.max(0, runtime.cooldownUntilTick - state.tick),
        cooldownTicks: isRecast ? Math.max(cooldown, runtime.recastCooldownTicks) : cooldown,
        aetherCost: abilityId === null ? 0 : this.readiness.priceOf(state, legend.id, abilityId),
        charge: slot === ULTIMATE_SLOT ? runtime.charge : null,
        isReady: blockedBy === null,
        blockedBy,
      };
    });
    return { entityId: legend.id, slots };
  }
}
