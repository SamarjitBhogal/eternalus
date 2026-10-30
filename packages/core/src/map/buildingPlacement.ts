import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import type { MapDecoration, MapFeature, MapLayout } from '../content/maps/maps.types';
/** Fits authored palace polygons inside the generated ring without scaling gameplay geometry. */
export const placePalace = (
  pieces: readonly MapDecoration[],
  feature: MapFeature,
  ring: Pick<MapLayout['wallRing'], 'radius' | 'thickness'>,
  origin = feature.position,
): readonly MapDecoration[] => {
  const scale = (ring.radius - ring.thickness - G.stronghold.clearance) / G.stronghold.extent;
  return pieces.map((piece) => ({
    ...piece,
    shape: piece.shape.map((p) => ({
      x: feature.position.x + (p.x - origin.x) * scale,
      y: feature.position.y + (p.y - origin.y) * scale,
    })),
  }));
};
