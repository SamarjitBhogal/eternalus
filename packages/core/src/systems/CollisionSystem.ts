import { Collider } from '../components/Collider';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import type { CollisionResolver } from '../physics/CollisionResolver';
import type { System, SystemContext } from './System.types';

/** Resolves moving units against exact generated walls and authored object footprints. */
export class CollisionSystem implements System {
  public readonly name = 'collision';

  /**
   * Geometry is shared with the map presentation, never reconstructed from screen pixels.
   *
   * @param resolver - The match's one collision rule (its walls, minus every destroyed object, and
   *   the map's bounds), shared with the state's `collisions` port, which cuts a dash with it.
   */
  public constructor(private readonly resolver: CollisionResolver) {}

  /** Sweeps from the pre-movement position, including the unit radius, inside the world's bounds. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const collider = entity.findComponent(Collider);
      if (
        !entity.hasComponent(Movement) ||
        transform === undefined ||
        collider?.isEnabled !== true ||
        collider.isStatic ||
        // A mob walking out of the structure it spawned inside passes its walls (DEC-133).
        entity.hasComponent(Deploying)
      )
        return;
      const from = transform.previousPosition;
      const delta = { x: transform.position.x - from.x, y: transform.position.y - from.y };
      transform.moveTo(this.resolver.move(from, delta, transform.radius));
    });
  }
}
