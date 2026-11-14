import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { addInto } from '../utils/vec2';
import type { MutableVec2 } from '../utils/vec2.types';
import type { System, SystemContext } from './System.types';

/**
 * Moves every entity that has `Movement` and `Transform`, in store order: one tick of
 * acceleration toward its heading (or of slowing down without one), then the velocity plus this
 * tick's forced motion (dashes and knock-backs, `Movement.push`) is added to the position in one
 * move, so `CollisionSystem` sweeps both against walls and world bounds alike. Statuses scale the
 * top speed (`moveSpeed`) or hold the entity's own walking (`cannot-move`); forced motion still
 * moves a stunned or airborne entity (Slam knocks back and up at once). While the match holds
 * units idle (`state.match.isIdleHeld`, the countdown) every entity is held, forced motion
 * included, which waits for the hold to end. Allocates nothing per entity (architecture 10 §2).
 */
export class MovementSystem implements System {
  public readonly name = 'movement';

  private readonly step: MutableVec2 = { x: 0, y: 0 };

  /** Advances every moving entity by one tick. */
  public update({ state }: SystemContext): void {
    const isHeld = state.match.isIdleHeld;
    state.entities.forEach((entity) => {
      const movement = entity.findComponent(Movement);
      const transform = entity.findComponent(Transform);

      if (movement !== undefined && transform !== undefined) {
        const statuses = entity.findComponent(StatusEffects);
        const speedScale =
          isHeld || statuses?.has('cannot-move') === true
            ? 0
            : (statuses?.multiplier('moveSpeed') ?? 1);
        movement.advance(speedScale);
        if (isHeld || !movement.isForced) {
          transform.moveBy(movement.velocity);
        } else {
          transform.moveBy(addInto(this.step, movement.velocity, movement.takeForcedStep()));
        }
      }
    });
  }
}
