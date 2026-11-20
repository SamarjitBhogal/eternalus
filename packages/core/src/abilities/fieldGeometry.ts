import { FIELD_POLYGON_SIDES } from '../content/abilities/starterEntities';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { cos, sin } from '../utils/deterministicMath';

/** A beam or wall rectangle aligned to a unit direction. */
export function fieldRectangle(
  from: Vec2,
  direction: Vec2,
  length: number,
  width: number,
): Polygon {
  const side = { x: (-direction.y * width) / 2, y: (direction.x * width) / 2 };
  const end = { x: from.x + direction.x * length, y: from.y + direction.y * length };
  return [
    { x: from.x + side.x, y: from.y + side.y },
    { x: end.x + side.x, y: end.y + side.y },
    { x: end.x - side.x, y: end.y - side.y },
    { x: from.x - side.x, y: from.y - side.y },
  ];
}

/** A fixed-resolution area outline; range checks still use the exact circle. */
export function fieldCircle(center: Vec2, radius: number): Polygon {
  return Array.from({ length: FIELD_POLYGON_SIDES }, (_, index) => {
    const angle = (index * Math.PI * 2) / FIELD_POLYGON_SIDES;
    return { x: center.x + cos(angle) * radius, y: center.y + sin(angle) * radius };
  });
}
