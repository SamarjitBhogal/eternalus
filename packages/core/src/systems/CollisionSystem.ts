import { Collider } from '../components/Collider';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import type { MapDefinition } from '../content/maps/maps.types';
import { CollisionResolver } from '../physics/CollisionResolver';
import type { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import type { System, SystemContext } from './System.types';

/** Resolves moving units against exact generated walls and authored object footprints. */
export class CollisionSystem implements System {
  public readonly name = 'collision';
  private readonly resolver: CollisionResolver;

  /**
   * Geometry is shared with the map presentation, never reconstructed from screen pixels.
   *
   * @param map - The match's map: its size bounds every unit.
   * @param index - The match's static collision index (`staticCollisionIndexOf`), shared with the
   *   match world's collision sweep; this system removes destroyed objects from it.
   */
  public constructor(
    private readonly map: MapDefinition,
    private readonly index: StaticCollisionIndex,
  ) {
    this.resolver = new CollisionResolver(index);
  }

  /** Sweeps from the pre-movement position, including the unit radius, then clamps world bounds. */
  public update({ state }: SystemContext): void {
    for (const id of state.worldObjects?.destroyedIds ?? []) this.index.remove(id);
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
      const end = this.resolver.move(from, delta, transform.radius);
      transform.moveTo({
        x: Math.max(transform.radius, Math.min(this.map.width - transform.radius, end.x)),
        y: Math.max(transform.radius, Math.min(this.map.height - transform.radius, end.y)),
      });
    });
  }
}
