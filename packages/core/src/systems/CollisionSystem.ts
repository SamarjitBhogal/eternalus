import { Collider } from '../components/Collider';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import type { CollisionResolver } from '../physics/CollisionResolver';
import type { MutableVec2 } from '../utils/vec2.types';
import type { System, SystemContext } from './System.types';

/**
 * Resolves moving units against exact generated walls and authored object footprints, then tells
 * each unit's `Movement` what part of its move the walls took (`hitBlock`), so a unit with momentum
 * loses the speed that ran into a wall (DEC-307).
 */
export class CollisionSystem implements System {
  public readonly name = 'collision';

  private readonly lost: MutableVec2 = { x: 0, y: 0 };

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
      const movement = entity.findComponent(Movement);
      if (
        movement === undefined ||
        transform === undefined ||
        collider?.isEnabled !== true ||
        collider.isStatic ||
        // A projectile stops at what it hits, it does not slide along it (`ProjectileSystem`).
        collider.layer === 'projectile' ||
        // A mob walking out of the structure it spawned inside passes its walls (DEC-133).
        entity.hasComponent(Deploying)
      )
        return;
      const from = transform.previousPosition;
      const delta = { x: transform.position.x - from.x, y: transform.position.y - from.y };
      const to = this.resolver.move(from, delta, transform.radius);
      transform.moveTo(to);
      this.lost.x = delta.x - (to.x - from.x);
      this.lost.y = delta.y - (to.y - from.y);
      movement.hitBlock(this.lost);
    });
  }
}
