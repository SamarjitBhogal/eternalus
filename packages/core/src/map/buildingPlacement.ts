import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import type { MapDecoration, MapFeature, MapLayout } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import type { PlayableTeam } from '../teams/teams.types';

/** Rotates a sketch point to face the enemy while preserving the palace's oval footprint. */
export const orientPalacePoint = (point: Vec2, team: PlayableTeam): Vec2 => {
  const { x, y, floorRadiusX, floorRadiusY } = G.palace;
  const direction = team === 'light' ? 1 : -1;
  return {
    x: x + direction * (point.y - y) * (floorRadiusX / floorRadiusY),
    y: y - direction * (point.x - x) * (floorRadiusY / floorRadiusX),
  };
};

const palaceScale = ({
  radius,
  thickness,
}: Pick<MapLayout['wallRing'], 'radius' | 'thickness'>): number =>
  (radius - thickness - G.stronghold.clearance) / G.stronghold.extent;

/** Places the Sovereign on the central aisle in front of the throne furniture. */
export const throneStandingPoint = (
  feature: MapFeature,
  team: PlayableTeam,
  ring: Pick<MapLayout['wallRing'], 'radius' | 'thickness'>,
): Vec2 => {
  const { x, y, throne } = G.palace;
  const point = orientPalacePoint({ x: x + throne.x, y: throne.standY }, team);
  const scale = palaceScale(ring);
  return {
    x: feature.position.x + (point.x - x) * scale,
    y: feature.position.y + (point.y - y) * scale,
  };
};
/** Fits authored palace polygons inside the generated ring without scaling gameplay geometry. */
export const placePalace = (
  pieces: readonly MapDecoration[],
  feature: MapFeature,
  ring: Pick<MapLayout['wallRing'], 'radius' | 'thickness'>,
  origin = feature.position,
): readonly MapDecoration[] => {
  const scale = palaceScale(ring);
  return pieces.map((piece) => ({
    ...piece,
    shape: piece.shape.map((p) => ({
      x: feature.position.x + (p.x - origin.x) * scale,
      y: feature.position.y + (p.y - origin.y) * scale,
    })),
  }));
};
