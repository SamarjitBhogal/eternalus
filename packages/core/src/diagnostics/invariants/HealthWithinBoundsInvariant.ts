import { Health } from '../../components/Health';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `health-within-bounds` (architecture 15 §3): `0 <= Health.current <= Health.max`, and every
 * shield bar `0 <= current <= max`.
 */
export class HealthWithinBoundsInvariant implements Invariant {
  public readonly id = 'health-within-bounds';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every entity whose health or a shield bar is out of its bounds. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];

    state.entities.forEach((entity) => {
      const health = entity.findComponent(Health);
      if (health === undefined) {
        return;
      }

      if (!HealthWithinBoundsInvariant.isWithin(health.current, health.max)) {
        violations.push(this.violation(entity.id, 'health', health.current, health.max));
      }
      for (const bar of health.shields) {
        if (!HealthWithinBoundsInvariant.isWithin(bar.current, bar.max)) {
          violations.push(
            this.violation(entity.id, `shield ${bar.sourceId}`, bar.current, bar.max),
          );
        }
      }
    });

    return violations;
  }

  private violation(entityId: string, bar: string, current: number, max: number): Violation {
    return {
      invariantId: this.id,
      severity: this.severity,
      message: `Entity "${entityId}" has ${bar} ${String(current)} outside 0..${String(max)}.`,
      entityId,
      details: { bar, current, max },
    };
  }

  private static isWithin(value: number, max: number): boolean {
    return value >= 0 && value <= max;
  }
}
