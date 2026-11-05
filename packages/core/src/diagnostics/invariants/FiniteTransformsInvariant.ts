import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { Invariant, Violation } from '../Invariant.types';
import { SPEED_TOLERANCE } from '../InvariantRunner.constants';
import { FACING_TOLERANCE } from './FiniteTransformsInvariant.constants';

/**
 * `finite-transforms` (architecture 15 §3): every position and velocity is a finite vector, every
 * facing is a unit vector, and no velocity is longer than its top speed (`Movement.topSpeed`:
 * `maxSpeed` scaled by statuses).
 */
export class FiniteTransformsInvariant implements Invariant {
  public readonly id = 'finite-transforms';

  public readonly severity = 'fatal';

  public readonly cadence = 'tick';

  /** Flags a non-finite position or velocity, a facing that is not a unit vector, or a velocity above top speed. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];

    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const movement = entity.findComponent(Movement);

      if (transform !== undefined && !FiniteTransformsInvariant.isFinite(transform.position)) {
        violations.push(this.violation(entity.id, 'non-finite position', transform.position));
      }
      if (transform !== undefined && !FiniteTransformsInvariant.isUnit(transform.facing)) {
        violations.push(
          this.violation(entity.id, 'facing that is not a unit vector', transform.facing),
        );
      }
      if (movement === undefined) {
        return;
      }
      if (!FiniteTransformsInvariant.isFinite(movement.velocity)) {
        violations.push(this.violation(entity.id, 'non-finite velocity', movement.velocity));
      } else if (
        Math.hypot(movement.velocity.x, movement.velocity.y) >
        movement.topSpeed * (1 + SPEED_TOLERANCE)
      ) {
        violations.push(this.violation(entity.id, 'velocity above top speed', movement.velocity));
      }
    });

    return violations;
  }

  private violation(entityId: string, problem: string, value: Vec2): Violation {
    return {
      invariantId: this.id,
      severity: this.severity,
      message: `Entity "${entityId}" has a ${problem} (${String(value.x)}, ${String(value.y)}).`,
      entityId,
      details: { problem, x: String(value.x), y: String(value.y) },
    };
  }

  private static isUnit(value: Vec2): boolean {
    return (
      FiniteTransformsInvariant.isFinite(value) &&
      Math.abs(Math.hypot(value.x, value.y) - 1) <= FACING_TOLERANCE
    );
  }

  private static isFinite(value: Vec2): boolean {
    return Number.isFinite(value.x) && Number.isFinite(value.y);
  }
}
