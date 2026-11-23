import { Collider } from '../components/Collider';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { System, SystemContext } from './System.types';

/**
 * Keeps each body's radius at its statuses' `size` (Berserk's 1.3, later `ascended` and
 * `eternal`): every tick it scales the `Transform` of each entity with `StatusEffects` to
 * `multiplier('size')`, so reach, areas, clicks, collision, the hash and the snapshot all read the
 * one radius. A moving body that grew is pushed out of the walls it now overlaps through the
 * match's collision rule (`state.collisions`), so no unit stands inside a wall; a body that
 * shrinks or stays the same is not moved. It runs after the casts and the statuses of the tick,
 * so a size takes effect in the tick its status starts or ends, and before movement.
 */
export class BodySizeSystem implements System {
  public readonly name = 'body-size';

  /** Scales every body with statuses to its `size` and pushes a grown mover out of walls. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const statuses = entity.findComponent(StatusEffects);
      if (transform === undefined || statuses === undefined) return;
      const before = transform.radius;
      transform.resize(statuses.multiplier('size'));
      if (
        transform.radius <= before ||
        state.collisions === null ||
        !entity.hasComponent(Movement) ||
        entity.findComponent(Collider)?.isEnabled !== true ||
        // A mob walking out of the structure it spawned inside passes its walls (DEC-133).
        entity.hasComponent(Deploying)
      )
        return;
      transform.moveTo(state.collisions.pushOut(transform.position, transform.radius));
    });
  }
}
