import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import type { SceneryLake } from './sceneryPlacement.types';
import { LAKES } from '../content/maps/map1Landforms';
import { RANDOM_SCENERY_SETTINGS as S } from '../content/maps/map1Scenery';
import { SeededRandom } from '../utils/SeededRandom';
import { distance, distanceToPath } from '../utils/geometry';

/** Places west-half lake templates from the match seed, outside lanes and landmark precincts. */
export function placeSceneryLakes(map: MapDefinition): readonly SceneryLake[] {
  const rng = new SeededRandom(map.seed).fork('scenery-lakes');
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
      if (((point.x - 800) / (270 + lake.rx)) ** 2 + ((point.y - 450) / (210 + lake.ry)) ** 2 < 1)
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
    const isMovable = ['tree-', 'lake-', 'village-', 'ground-fleck-', 'hill-', 'mountain-'].some(
      (prefix) => piece.id.startsWith(prefix),
    );
    if (!isMovable || piece.id.startsWith('village-well-')) return [piece];
    const centre = piece.shape.reduce((sum, point) => sum + point.x, 0) / piece.shape.length;
    if (centre >= width / 2) return [];
    return [
      piece,
      {
        ...piece,
        id: piece.id.startsWith('mountain-west-')
          ? piece.id.replace('mountain-west-', 'mountain-east-')
          : piece.id.startsWith('mountain-')
            ? piece.id.replace(/(-[^-]+)$/, '-mirror$1')
            : `${piece.id}-mirror`,
        shape: piece.shape.map((point) => ({ x: width - point.x, y: point.y })),
      },
    ];
  });
}
