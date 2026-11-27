import type { PlacedWalls } from '../state/PlacedWalls.types';
import { placePolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { PlacedSummon } from './summonPlacement.types';

/** Where a summoned body stands: `distance` metres from `from` along `direction` (a unit vector). */
export function summonPosition(from: Vec2, direction: Vec2, distance: number): Vec2 {
  return { x: from.x + direction.x * distance, y: from.y + direction.y * distance };
}

/**
 * Where a body with the outline `corners` (metres, +x along its facing:
 * `ObstacleDefinition.footprint`) stands when it is placed `distance` metres from `from` along
 * `direction` (a unit vector), facing that way, and whether it cannot stand there. It cannot when
 * its outline overlaps a wall (terrain, a blocking map object, a placed body) or reaches past the
 * map's edge (`PlacedWalls.isBlocked`). With no walls (no map objects) it is not blocked.
 * Returns `null` for the zero direction: an aim on the caster places no outline. This is the one
 * rule a `summon` step refuses a cast with and the aim overlay previews with, so the client keeps
 * no copy of the turning rule (DEC-382, HC-B43 (7), HC-S15).
 */
export function summonPreview(
  walls: PlacedWalls | null,
  corners: Polygon,
  from: Vec2,
  direction: Vec2,
  distance: number,
): PlacedSummon | null {
  if (direction.x === 0 && direction.y === 0) return null;
  const outline = placePolygon(corners, summonPosition(from, direction, distance), direction);
  return { outline, isBlocked: walls?.isBlocked(outline) ?? false };
}
