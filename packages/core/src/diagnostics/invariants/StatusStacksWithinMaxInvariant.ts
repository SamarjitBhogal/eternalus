import { StatusEffects } from '../../components/StatusEffects';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/** `status-stacks-within-max` (architecture 05 section 16): every active status has `1 <= stacks <= maxStacks`. */
export class StatusStacksWithinMaxInvariant implements Invariant {
  public readonly id = 'status-stacks-within-max';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every active status whose stack count is out of range. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];

    state.entities.forEach((entity) => {
      for (const status of entity.findComponent(StatusEffects)?.active ?? []) {
        const { stacks } = status;
        const { id, maxStacks } = status.definition;
        if (stacks < 1 || stacks > maxStacks) {
          violations.push({
            invariantId: this.id,
            severity: this.severity,
            message: `Entity "${entity.id}" has ${String(stacks)} stacks of "${id}" outside 1..${String(maxStacks)}.`,
            entityId: entity.id,
            details: { statusId: id, stacks, maxStacks },
          });
        }
      }
    });

    return violations;
  }
}
