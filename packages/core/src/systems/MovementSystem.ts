import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { System, SystemContext } from './System.types';

/**
 * Moves every entity that has `Movement` and `Transform`, in store order: one tick of
 * acceleration toward its heading (or of slowing down without one), then the velocity is added
 * to the position. Statuses scale the top speed (`moveSpeed`) or hold the entity in place
 * (`cannot-move`). Allocates nothing per entity (architecture 10 §2).
 */
export class MovementSystem implements System {
  public readonly name = 'movement';

  /** Advances every moving entity by one tick. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) => {
      const movement = entity.findComponent(Movement);
      const transform = entity.findComponent(Transform);

      if (movement !== undefined && transform !== undefined) {
        const statuses = entity.findComponent(StatusEffects);
        const speedScale =
          statuses === undefined
            ? 1
            : statuses.has('cannot-move')
              ? 0
              : statuses.multiplier('moveSpeed');
        movement.advance(speedScale);
        transform.moveBy(movement.velocity);
      }
    });
  }
}
