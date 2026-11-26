import { Collider } from '../../components/Collider';
import { Deploying } from '../../components/Deploying';
import { Movement } from '../../components/Movement';
import { ProjectilePayload } from '../../components/ProjectilePayload';
import { Transform } from '../../components/Transform';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * Detects units placed into surviving solids independently of the collision solver. A shot inside
 * a shape that does not stop it is not a violation (`WorldObjectStore.blockingAt` with the shot's
 * launch point, by the rule the sweep uses, `doesShapeStopShot`): a shape that holds its own
 * launch point, which the shot can only leave (the launch-shape rule, DEC-334), as a wall turret's
 * bolt leaves its pylon and wall; and a shape flagged `canShotsCross` (a lake, a lava river, a
 * camp fire; DEC-345, DEC-373). A unit in such a shape is still a violation.
 */
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
        entity.findComponent(Collider)?.isEnabled !== true ||
        // A mob walking out of the structure it spawned inside passes its walls (DEC-133).
        entity.hasComponent(Deploying)
      )
        return;
      const launch = entity.findComponent(ProjectilePayload)?.origin;
      const objectId = state.worldObjects?.blockingAt(transform.position, transform.radius, launch);
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
