import { Abilities } from '../components/Abilities';
import { Transform } from '../components/Transform';
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
  /** @param readiness - The cast rules the slots are judged by (`abilities/CastReadiness`). */
  public constructor(private readonly readiness: SlotReadiness) {}

  /** The player's slots, or `null` when `legend` has no ability bar. */
  public snapshotOf(state: GameState, legend: Entity): PlayerSnapshot | null {
    const abilities = legend.findComponent(Abilities);
    if (abilities === undefined) {
      return null;
    }
    // A directional ability needs an aim; the slot's own state decides readiness, so aim one
    // metre to the right of the Legend (a zero aim would read as `no-target` on every dash).
    const at = legend.findComponent(Transform)?.position ?? { x: 0, y: 0 };
    const aim = { point: { x: at.x + 1, y: at.y }, targetId: null };
    const slots: AbilitySlotSnapshot[] = abilities.slots.map((runtime) => {
      const { abilityId, slot } = runtime;
      const blockedBy = this.readiness.blockedBy(state, legend.id, slot, aim);
      return {
        slot,
        abilityId,
        cooldownRemainingTicks: runtime.cooldownRemaining(state.tick),
        cooldownTicks: abilityId === null ? 0 : this.readiness.cooldownTicksOf(abilityId),
        aetherCost: abilityId === null ? 0 : this.readiness.priceOf(state, legend.id, abilityId),
        // ponytail: the ultimate meter is built with Fury (phase 4); until then no slot reports one.
        charge: null,
        isReady: blockedBy === null,
        // `unknown-entity` cannot happen: the legend is in the store; `dead` is the closest reason.
        blockedBy: blockedBy === 'unknown-entity' ? 'dead' : blockedBy,
      };
    });
    return { entityId: legend.id, slots };
  }
}
