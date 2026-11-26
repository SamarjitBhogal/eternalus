import type { PlacedWalls } from '../state/PlacedWalls.types';
import { placePolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';

/** Where a summoned body stands: `distance` metres from `from` along `direction` (a unit vector). */
export function summonPosition(from: Vec2, direction: Vec2, distance: number): Vec2 {
  return { x: from.x + direction.x * distance, y: from.y + direction.y * distance };
}

/**
 * Whether a body with the outline `corners` (metres, +x along its facing:
 * `ObstacleDefinition.footprint`) cannot stand `distance` metres from `from` along `direction`
 * (a unit vector), facing that way. It cannot when its outline there overlaps a wall (terrain, a
 * blocking map object, a placed body) or reaches past the map's edge (`PlacedWalls.isBlocked`).
 * Nothing blocks it with no walls (no map objects) or with the zero direction (an aim on the
 * caster places no outline). The one rule `SummonEffect` refuses a cast with and
 * `Simulation.isSummonBlocked` previews with, so the aim overlay shows a refused Shield Wall
 * (DEC-382, HC-B43 (7)).
 */
export function isSummonBlocked(
  walls: PlacedWalls | null,
  corners: Polygon,
  from: Vec2,
  direction: Vec2,
  distance: number,
): boolean {
  if (walls === null || (direction.x === 0 && direction.y === 0)) return false;
  return walls.isBlocked(
    placePolygon(corners, summonPosition(from, direction, distance), direction),
  );
}
