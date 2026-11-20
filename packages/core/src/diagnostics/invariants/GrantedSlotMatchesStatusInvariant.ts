import { Abilities } from '../../components/Abilities';
import { StatusEffects } from '../../components/StatusEffects';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `granted-slot-matches-status` (light): an entity's `granted` slot holds an ability only while one
 * of its active statuses grants that ability (Fury's dash, DEC-270), and is empty while none grants
 * one. `StatusEffectApplier` keeps the two in step; a status ended around it leaves the slot behind.
 */
export class GrantedSlotMatchesStatusInvariant implements Invariant {
  public readonly id = 'granted-slot-matches-status';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every `granted` slot out of step with its holder's statuses, in store order. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      const slot = entity.findComponent(Abilities)?.slot('granted');
      if (slot === undefined) {
        return;
      }
      const held = slot.abilityId;
      const active = entity.findComponent(StatusEffects)?.active ?? [];
      const isInStep =
        held === null
          ? active.every(({ definition }) => definition.grants === undefined)
          : active.some(({ definition }) => definition.grants === held);
      if (!isInStep) {
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message:
            held === null
              ? `Entity "${entity.id}" has an empty granted slot while a status grants an ability.`
              : `Entity "${entity.id}" holds "${held}" in its granted slot, which no active status grants.`,
          entityId: entity.id,
          details: { held: held ?? 'none' },
        });
      }
    });
    return violations;
  }
}
