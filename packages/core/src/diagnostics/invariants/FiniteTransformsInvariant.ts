import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { GameState } from '../../state/GameState';
import type { Vec2 } from '../../utils/geometry.types';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `finite-transforms` (architecture 15 §3): every position and velocity is a finite vector, and
 * no speed is above its `maxSpeed`.
 */
export class FiniteTransformsInvariant implements Invariant {
  public readonly id = 'finite-transforms';

  public readonly severity = 'fatal';

  public readonly cadence = 'tick';

  /** Flags every entity with a non-finite position or velocity, or a speed above its maximum. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];

    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const movement = entity.findComponent(Movement);

      if (transform !== undefined && !FiniteTransformsInvariant.isFinite(transform.position)) {
        violations.push(this.violation(entity.id, 'position', transform.position));
      }
      if (movement !== undefined && !FiniteTransformsInvariant.isFinite(movement.velocity)) {
        violations.push(this.violation(entity.id, 'velocity', movement.velocity));
      }
      if (movement !== undefined && movement.speed > movement.maxSpeed) {
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message: `Entity "${entity.id}" moves at ${String(movement.speed)}, above its maxSpeed ${String(movement.maxSpeed)}.`,
          entityId: entity.id,
          details: { speed: movement.speed, maxSpeed: movement.maxSpeed },
        });
      }
    });

    return violations;
  }

  private violation(entityId: string, field: string, value: Vec2): Violation {
    return {
      invariantId: this.id,
      severity: this.severity,
      message: `Entity "${entityId}" has a non-finite ${field} (${String(value.x)}, ${String(value.y)}).`,
      entityId,
      details: { field, x: String(value.x), y: String(value.y) },
    };
  }

  private static isFinite(value: Vec2): boolean {
    return Number.isFinite(value.x) && Number.isFinite(value.y);
  }
}
