import type { MapDefinition, MapFeature, MapTerrain } from '../content/maps/maps.types';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { mirrorPoint } from './symmetry';

/** Positions closer than this are the same point (floating-point slack, in world units). */
const EPSILON = 1e-6;

const MIRRORED_TEAM: Readonly<Record<Team, Team>> = {
  light: 'dark',
  dark: 'light',
  neutral: 'neutral',
};

const isSamePoint = (a: Vec2, b: Vec2): boolean =>
  Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;

/** Whether two polygons have the same corners, in any order. */
const isSameShape = (a: Polygon, b: Polygon): boolean =>
  a.length === b.length && a.every((point) => b.some((other) => isSamePoint(point, other)));

const isMirrorFeature = (feature: MapFeature, other: MapFeature, width: number): boolean =>
  other.kind === feature.kind &&
  other.definitionId === feature.definitionId &&
  other.team === MIRRORED_TEAM[feature.team] &&
  other.laneId === feature.laneId &&
  isSamePoint(other.position, mirrorPoint(feature.position, width));

const isMirrorTerrain = (piece: MapTerrain, other: MapTerrain, width: number): boolean =>
  other.kind === piece.kind &&
  isSameShape(
    other.shape,
    piece.shape.map((point) => mirrorPoint(point, width)),
  );

/**
 * Names of everything in a map that has no mirror image across the vertical centre line:
 * every feature needs a twin of the same kind, definition and lane on the other team (or
 * itself, when it sits on the line), every terrain shape a mirrored twin, every lane must
 * mirror onto itself. ADR 0009: the map is symmetric about the centre.
 */
export const findAsymmetries = (map: MapDefinition): readonly string[] => {
  const features = map.features
    .filter((feature) => !map.features.some((other) => isMirrorFeature(feature, other, map.width)))
    .map((feature) => `feature '${feature.id}'`);
  const terrain = map.terrain
    .filter((piece) => !map.terrain.some((other) => isMirrorTerrain(piece, other, map.width)))
    .map((piece) => `terrain '${piece.id}'`);
  const lanes = map.lanes
    .filter(
      (lane) =>
        !lane.path.every((point, index) => {
          const twin = lane.path[lane.path.length - 1 - index];
          return twin !== undefined && isSamePoint(point, mirrorPoint(twin, map.width));
        }),
    )
    .map((lane) => `lane '${lane.id}'`);
  return [...features, ...terrain, ...lanes];
};
