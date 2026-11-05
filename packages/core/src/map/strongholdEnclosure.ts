import type { MapDefinition, MapFeature } from '../content/maps/maps.types';
import type { Polygon } from '../utils/geometry.types';
import { outerFace } from './wallRing';

/**
 * The ground a Stronghold's shield arc and cliffs enclose, the wall's own footprint included
 * (DEC-188, owner 2026-11-05: "inside arc + cliffs"): the outer face of its team's wall segments
 * and gates from tip to tip, closed behind by the cliffs, which run from each tip to the world
 * edge behind the Stronghold (`strongholdCliffs`). The face is sorted north to south: it rises
 * steadily from tip to tip (`buildWallRing`). `undefined` when the map has no shield for that team.
 * It is the outline of the Stronghold's heal zone, which leaves out the ground of the shield's
 * walls, gates and turrets (`HealingZones`, DEC-215 (2), (5)).
 */
export const strongholdEnclosure = (
  map: MapDefinition,
  stronghold: MapFeature,
): Polygon | undefined => {
  const face = map.features
    .filter(
      ({ kind, team }) => (kind === 'wall-segment' || kind === 'gate') && team === stronghold.team,
    )
    .flatMap(({ footprint }) => (footprint === undefined ? [] : outerFace(footprint)))
    .sort((a, b) => a.y - b.y);
  const north = face[0];
  const south = face.at(-1);
  if (north === undefined || south === undefined) return undefined;
  const edgeX = stronghold.position.x < map.width / 2 ? 0 : map.width;
  return [{ x: edgeX, y: north.y }, ...face, { x: edgeX, y: south.y }];
};
