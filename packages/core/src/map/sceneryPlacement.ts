import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import type { SceneryLake } from './sceneryPlacement.types';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { LAKES } from '../content/maps/map1Landforms';
import { RANDOM_SCENERY_SETTINGS as S } from '../content/maps/map1Scenery';
import { SeededRandom } from '../utils/SeededRandom';
import { distance, distanceToPath, doRectsOverlap } from '../utils/geometry';
import { laneFortKeepOuts } from './fortInWorld';

/**
 * Places west-half lake templates from the match seed, outside lanes, landmark precincts and the
 * ground round every lane tower fort (`laneFortKeepOuts`, DEC-315).
 */
export function placeSceneryLakes(map: MapDefinition): readonly SceneryLake[] {
  const rng = new SeededRandom(map.seed).fork('scenery-lakes');
  const keepOuts = laneFortKeepOuts(map.features);
  return LAKES.filter((lake) => lake.x < map.width / 2).flatMap((lake) => {
    for (let attempt = 0; attempt < S.attempts; attempt++) {
      const point = {
        x: lake.x + (rng.nextFloat() * 2 - 1) * S.lakeWander,
        y: lake.y + (rng.nextFloat() * 2 - 1) * S.lakeWander,
      };
      if (
        point.x < 280 + lake.rx ||
        point.x + lake.rx >= map.width / 2 ||
        point.y < lake.ry + 60 ||
        point.y + lake.ry > map.height - 60
      )
        continue;
      if (map.lanes.some((lane) => distanceToPath(point, lane.path) < lake.ry + 18)) continue;
      if (
        map.features.some(
          (feature) => distance(point, feature.position) < lake.ry + S.lakeFeatureClearance,
        )
      )
        continue;
      // The lake's blocking water is its `rx` x `ry` ellipse; its box stays off every lane fort.
      const water = {
        x: point.x - lake.rx,
        y: point.y - lake.ry,
        width: 2 * lake.rx,
        height: 2 * lake.ry,
      };
      if (keepOuts.some((box) => doRectsOverlap(water, box))) continue;
      if (
        ((point.x - G.cathedral.x) / (G.cathedral.precinct.radiusX + lake.rx)) ** 2 +
          ((point.y - G.cathedral.y) / (G.cathedral.precinct.radiusY + lake.ry)) ** 2 <
        1
      )
        continue;
      return [{ ...lake, ...point }];
    }
    return [];
  });
}

/** Reflects movable scenery as complete polygons, keeping matching material and dimensions. */
export function mirrorMovableScenery(
  pieces: readonly MapDecoration[],
  width: number,
): readonly MapDecoration[] {
  return pieces.flatMap((piece) => {
    if (piece.isMirrored !== true) return [piece];
    const centre = piece.shape.reduce((sum, point) => sum + point.x, 0) / piece.shape.length;
    if (centre >= width / 2) return [];
    return [
      piece,
      {
        ...piece,
        id: piece.mirrorId ?? `${piece.id}-mirror`,
        ...(piece.object === undefined
          ? {}
          : { object: { ...piece.object, id: `${piece.object.id}-mirror` } }),
        shape: piece.shape.map((point) => ({ x: width - point.x, y: point.y })),
      },
    ];
  });
}
