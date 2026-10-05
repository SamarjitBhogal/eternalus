import type { MapDefinition, MapLane } from '../content/maps/maps.types';
import { distance, isPointInPolygon, lerpPoint } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import { MapGenerationError } from './MapGenerationError';
import { findAsymmetries } from './mapSymmetry';

/** Floating-point slack when comparing lane x positions, in world units. */
const EPSILON = 1e-6;

/** Spacing of the points checked along each lane, in world units. */
const LANE_SAMPLE_STEP = 5;

const lanePoints = (path: readonly Vec2[]): Vec2[] =>
  path.flatMap((from, index) => {
    const to = path[index + 1];
    if (to === undefined) {
      return [from];
    }
    const steps = Math.max(1, Math.ceil(distance(from, to) / LANE_SAMPLE_STEP));
    return Array.from({ length: steps }, (_, step) => lerpPoint(from, to, step / steps));
  });

const isInsideWorld = (map: MapDefinition, point: Vec2): boolean =>
  point.x >= 0 && point.x <= map.width && point.y >= 0 && point.y <= map.height;

/**
 * What is wrong with one lane: leaving the world, running through terrain, running west
 * (lanes go from the Light gate east to the Dark gate), or running through the footprint of a
 * team structure that is not on this lane (a wall segment, turret or Stronghold).
 */
const laneProblems = (map: MapDefinition, lane: MapLane): string[] => {
  const problems: string[] = [];
  const points = lanePoints(lane.path);
  if (!points.every((point) => isInsideWorld(map, point))) {
    problems.push(`lane '${lane.id}' leaves the world`);
  }
  const terrain = map.terrain.find((piece) =>
    points.some((point) => isPointInPolygon(point, piece.shape)),
  );
  if (terrain !== undefined) {
    problems.push(`lane '${lane.id}' runs through terrain '${terrain.id}'`);
  }
  if (
    lane.path.some(
      (point, index) => index > 0 && point.x < (lane.path[index - 1]?.x ?? point.x) - EPSILON,
    )
  ) {
    problems.push(`lane '${lane.id}' runs west somewhere (lanes must only run east)`);
  }
  const structure = map.features.find(
    (feature) =>
      feature.team !== 'neutral' &&
      feature.laneId === undefined &&
      feature.footprint !== undefined &&
      points.some((point) => isPointInPolygon(point, feature.footprint ?? [])),
  );
  if (structure !== undefined) {
    problems.push(`lane '${lane.id}' runs through '${structure.id}'`);
  }
  return problems;
};

const findProblems = (map: MapDefinition): string[] => {
  const problems: string[] = [];
  const ids = [...map.lanes, ...map.terrain, ...map.features].map((item) => item.id);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate !== undefined) {
    problems.push(`duplicate id '${duplicate}'`);
  }
  const outside = map.features.find((feature) => !isInsideWorld(map, feature.position));
  if (outside !== undefined) {
    problems.push(`feature '${outside.id}' lies outside the world`);
  }
  const shapes = map.terrain.map((piece) => piece.shape);
  const buried = map.features.find(
    (feature) =>
      feature.team !== 'neutral' &&
      shapes.some((shape) => isPointInPolygon(feature.position, shape)),
  );
  if (buried !== undefined) {
    problems.push(`team feature '${buried.id}' sits inside rift or out-of-bounds terrain`);
  }
  problems.push(...map.lanes.flatMap((lane) => laneProblems(map, lane)));
  const asymmetric = findAsymmetries(map);
  if (asymmetric.length > 0) {
    problems.push(`not mirror-symmetric: ${asymmetric.slice(0, 5).join(', ')}`);
  }
  return problems;
};

/**
 * Checks a generated map: unique ids, everything inside the world, no team feature inside
 * terrain, every lane running east without crossing terrain or another lane's walls and
 * turrets, and mirror symmetry of every feature, terrain shape and lane. A preset whose ground does
 * not fit the configured lanes fails here with a message naming the lane and the terrain.
 */
export const validateMapDefinition = (map: MapDefinition): void => {
  const problems = findProblems(map);
  if (problems.length > 0) {
    throw new MapGenerationError(`Invalid map '${map.id}': ${problems.join('; ')}`);
  }
};
