import { MapObjectBody } from '../components/MapObjectBody';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import { sweepCircle } from '../physics/sweepCircle';
import { sqrt } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';

/** Distance to the first exact footprint or body along a swept point projectile. */
export function bladeContact(target: Entity, from: Vec2, direction: Vec2, travel: number): number {
  const polygons = target.findComponent(MapObjectBody)?.object.footprints;
  if (polygons !== undefined) {
    return Math.min(
      ...polygons.map((polygon) => {
        const contact = sweepCircle(
          from,
          { x: direction.x * travel, y: direction.y * travel },
          Number.EPSILON,
          polygon,
        );
        return contact === null ? Infinity : contact.time * travel;
      }),
    );
  }
  const body = target.findComponent(Transform);
  if (body === undefined) return Infinity;
  const dx = body.position.x - from.x;
  const dy = body.position.y - from.y;
  const along = dx * direction.x + dy * direction.y;
  const off = Math.max(0, dx * dx + dy * dy - along * along);
  if (off > body.radius * body.radius || along + body.radius < 0) return Infinity;
  return Math.max(0, along - sqrt(Math.max(0, body.radius * body.radius - off)));
}
