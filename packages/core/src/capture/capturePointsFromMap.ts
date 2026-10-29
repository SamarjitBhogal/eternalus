import type { MapDefinition, MapFeature } from '../content/maps/maps.types';
import { CATHEDRAL_ZONE_SIZE, LANE_ZONE_SIZE } from './capture.constants';
import type { CapturePointDefinition } from './CapturePoint.types';

/**
 * The capture zones of a generated map: one per `capture-point` feature, plus the Cathedral as
 * the major point (design doc, "Map 1"), unless a `capture-point` already sits on it. Zones are
 * squares centred on the feature, sized as a fraction of the map width so they scale with it.
 */
export function capturePointsFromMap(map: MapDefinition): CapturePointDefinition[] {
  const lanePoints = map.features
    .filter((feature) => feature.kind === 'capture-point')
    .map((feature) => toZone(feature, map.width * LANE_ZONE_SIZE));

  const cathedral = map.features.find((feature) => feature.kind === 'cathedral');
  if (cathedral === undefined) {
    return lanePoints;
  }
  const zone = toZone(cathedral, map.width * CATHEDRAL_ZONE_SIZE);
  const isCovered = lanePoints.some(
    (point) =>
      Math.abs(point.center.x - zone.center.x) <= zone.halfSize &&
      Math.abs(point.center.y - zone.center.y) <= zone.halfSize,
  );
  return isCovered ? lanePoints : [...lanePoints, zone];
}

function toZone(feature: MapFeature, halfSize: number): CapturePointDefinition {
  return {
    id: feature.id,
    lane: feature.laneId ?? (feature.kind === 'cathedral' ? 'cathedral' : 'unknown'),
    center: { x: feature.position.x, y: feature.position.y },
    halfSize,
  };
}
