import type { MapBuilding } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import { isPointInPolygon } from '../utils/geometry';

/**
 * The building whose interior holds `point`: the first of `buildings` with a footprint polygon
 * around it, or `undefined` on open ground. The one "which building is this point in" test, shared
 * by the client's roofs and, later, the capture zones (DEC-149).
 *
 * Assumes building footprints do not overlap. If two ever do, the first one in `buildings` order
 * wins, so list order is then a gameplay rule (capture zones may reuse this).
 */
export const findBuildingAt = (
  buildings: readonly MapBuilding[],
  point: Vec2,
): MapBuilding | undefined =>
  buildings.find((building) => building.footprint.some((shape) => isPointInPolygon(point, shape)));
