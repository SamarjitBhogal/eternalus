import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { SKETCH_HEIGHT, SKETCH_WIDTH } from '../content/maps/map1Scenery';
import type { MapDefinition, MapFeature, MapFeatureKind } from '../content/maps/maps.types';
import type { Polygon } from '../utils/geometry.types';
import { MapGenerationError } from './MapGenerationError';
import { MapPresentationBuilder } from './MapPresentationBuilder';

/** Builds the floor of the building one map feature stands for, in world units. */
type ZoneAreaOf = (map: MapDefinition, feature: MapFeature) => readonly Polygon[];

/**
 * The floor each zone-placing feature kind covers (architecture 07 §7, DEC-145 (a)): an outer
 * capture point the court inside its fort's walls (a unit in a gateway counts once past their
 * inner face), the Cathedral its floor footprint (nave, transept, apse, doors).
 */
const ZONE_AREAS: Readonly<Partial<Record<MapFeatureKind, ZoneAreaOf>>> = {
  'capture-point': (map, { position }) => {
    // The fort is drawn in sketch units (MapFortificationBuilder) and stretched per axis.
    const half = (G.fort.capturePointSize - (2 * G.fort.capturePointSize) / G.fort.wallDivisor) / 2;
    const halfWidth = half * (map.width / SKETCH_WIDTH);
    const halfHeight = half * (map.height / SKETCH_HEIGHT);
    const { x, y } = position;
    return [
      [
        { x: x - halfWidth, y: y - halfHeight },
        { x: x + halfWidth, y: y - halfHeight },
        { x: x + halfWidth, y: y + halfHeight },
        { x: x - halfWidth, y: y + halfHeight },
      ],
    ];
  },
  cathedral: (map, feature) => new MapPresentationBuilder().footprintOf(map, feature),
};

/**
 * The area of the zone that `feature` places: the floor of its building, as polygons in world
 * units. It reads the map alone, so every match on the same map gets the same zones.
 *
 * @throws MapGenerationError when the feature's kind has no zone area.
 */
export const zoneAreaOf = (map: MapDefinition, feature: MapFeature): readonly Polygon[] => {
  const area = ZONE_AREAS[feature.kind]?.(map, feature);
  if (area === undefined || area.length === 0) {
    throw new MapGenerationError(
      `Map feature "${feature.id}" (${feature.kind}) has no zone area for the zone it places.`,
    );
  }
  return area;
};
