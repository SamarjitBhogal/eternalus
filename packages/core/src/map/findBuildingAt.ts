import type { MapBuilding } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import { isPointInAnyPolygon } from '../utils/geometry';

/**
 * The building whose interior holds `point`: the first of `buildings` with a footprint polygon
 * around it, or `undefined` on open ground. The one "which building is this point in" test, used
 * by the client's roofs (DEC-149). Capture zones share its point test (`isPointInAnyPolygon`),
 * not this function: a zone's floor is not always a building footprint (DEC-145 (a)).
 *
 * Assumes building footprints do not overlap. If two ever do, the first one in `buildings` order
 * wins.
 */
export const findBuildingAt = (
  buildings: readonly MapBuilding[],
  point: Vec2,
): MapBuilding | undefined =>
  buildings.find((building) => isPointInAnyPolygon(point, building.footprint));
