import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { Invariant, Violation } from '../Invariant.types';
import { SPEED_TOLERANCE } from '../InvariantRunner.constants';

/**
 * `finite-transforms` (architecture 15 §3): every position and velocity is a finite vector, and
 * no velocity is longer than its `maxSpeed`.
 */
export class FiniteTransformsInvariant implements Invariant {
  public readonly id = 'finite-transforms';

  public readonly severity = 'fatal';

  public readonly cadence = 'tick';

  /** Flags every entity with a non-finite position or velocity, or a velocity above maxSpeed. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];

    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const movement = entity.findComponent(Movement);

      if (transform !== undefined && !FiniteTransformsInvariant.isFinite(transform.position)) {
        violations.push(this.violation(entity.id, 'non-finite position', transform.position));
      }
      if (movement === undefined) {
        return;
      }
      if (!FiniteTransformsInvariant.isFinite(movement.velocity)) {
        violations.push(this.violation(entity.id, 'non-finite velocity', movement.velocity));
      } else if (
        Math.hypot(movement.velocity.x, movement.velocity.y) >
        movement.maxSpeed * (1 + SPEED_TOLERANCE)
      ) {
        violations.push(this.violation(entity.id, 'velocity above maxSpeed', movement.velocity));
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

  private static isFinite(value: Vec2): boolean {
    return Number.isFinite(value.x) && Number.isFinite(value.y);
  }
}
