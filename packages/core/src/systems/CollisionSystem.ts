import { Collider } from '../components/Collider';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import type { MapDefinition } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import { CollisionResolver } from '../physics/CollisionResolver';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import type { System, SystemContext } from './System.types';

/** Resolves moving units against exact generated walls and authored object footprints. */
export class CollisionSystem implements System {
  public readonly name = 'collision';
  private readonly index: StaticCollisionIndex;
  private readonly resolver: CollisionResolver;

  /** Geometry is shared with the map presentation, never reconstructed from screen pixels. */
  public constructor(
    private readonly map: MapDefinition,
    objects: readonly MapObject[],
  ) {
    const shapes = objects.flatMap((object) =>
      object.isBlocking
        ? object.footprints.map((polygon) => ({
            id: object.id,
            polygon,
            ...(object.passages === undefined ? {} : { passages: object.passages }),
          }))
        : [],
    );
    this.index = new StaticCollisionIndex([
      ...shapes,
      ...map.terrain.map((terrain) => ({ id: terrain.id, polygon: terrain.shape })),
    ]);
    this.resolver = new CollisionResolver(this.index);
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
        collider.isStatic
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
