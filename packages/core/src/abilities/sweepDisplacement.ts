import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import { CollisionResolver } from '../physics/CollisionResolver';
import type { StaticCollisionShape } from '../physics/StaticCollisionIndex.types';

/** Resolves ability displacement against the same authored physical geometry as walking. */
export const sweepDisplacement = (state: GameState, entity: Entity, delta: Vec2): void => {
  const transform = entity.findComponent(Transform);
  if (transform === undefined) return;
  const shapes: StaticCollisionShape[] = [];
  state.entities.forEach((other) => {
    const object = state.worldObjects?.objectFor(other.id);
    if (object?.isBlocking === true)
      shapes.push(
        ...object.footprints.map((polygon) => ({
          id: object.id,
          polygon,
          ...(object.passages === undefined ? {} : { passages: object.passages }),
        })),
      );
  });
  shapes.push(
    ...(state.world?.definition.terrain ?? []).map((piece) => ({
      id: piece.id,
      polygon: piece.shape,
    })),
  );
  const end = new CollisionResolver(new StaticCollisionIndex(shapes)).move(
    transform.position,
    delta,
    transform.radius,
  );
  const world = state.world?.definition;
  transform.moveTo(
    world === undefined
      ? end
      : {
          x: Math.max(transform.radius, Math.min(world.width - transform.radius, end.x)),
          y: Math.max(transform.radius, Math.min(world.height - transform.radius, end.y)),
        },
  );
};
