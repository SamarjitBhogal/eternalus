import { Collider } from '../../components/Collider';
import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/** Detects units placed into surviving solids independently of the collision solver. */
export class NoMapObjectOverlapInvariant implements Invariant {
  public readonly id = 'no-map-object-overlap';
  public readonly severity = 'error';
  public readonly cadence = 'periodic';
  /** Periodic full checks complement collision resolution on every tick. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      if (
        !entity.hasComponent(Movement) ||
        transform === undefined ||
        entity.findComponent(Collider)?.isEnabled !== true
      )
        return;
      const objectId = state.worldObjects?.blockingAt(transform.position, transform.radius);
      if (objectId != null)
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          entityId: entity.id,
          message: 'Unit overlaps a surviving map object.',
          details: { objectId },
        });
    });
    return violations;
  }
}
