import { Abilities } from '../../components/Abilities';
import { ULTIMATE_SLOT } from '../../components/Abilities.constants';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `ultimate-never-fills-passively` (architecture 05 §16, heavy): every ultimate meter holds the
 * charge last announced for it (`GameState.charges`, fed by `ultimate-charged` and the ultimate's
 * `ability-cast`). The meter changes only through `ProgressionSystem`'s announced changes and a
 * cast, so a fill from anywhere else, passive or not, shows here.
 */
export class UltimateNeverFillsPassivelyInvariant implements Invariant {
  public readonly id = 'ultimate-never-fills-passively';

  public readonly severity = 'error';

  public readonly cadence = 'periodic';

  /** Flags every ultimate meter whose charge differs from its last announcement, in store order. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      const meter = entity.findComponent(Abilities)?.slot(ULTIMATE_SLOT);
      const announced = state.charges.announcedChargeOf(entity.id);
      if (meter !== undefined && meter.charge !== announced) {
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message: `Entity "${entity.id}" holds ultimate charge ${String(meter.charge)}, but ${String(announced)} was announced.`,
          entityId: entity.id,
          details: { charge: meter.charge, announced },
        });
      }
    });
    return violations;
  }
}
