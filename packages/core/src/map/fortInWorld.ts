import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { SKETCH_HEIGHT, SKETCH_WIDTH } from '../content/maps/map1Scenery';
import type { MapFeature } from '../content/maps/maps.types';
import type { FortWallRole, MapObject } from '../content/maps/mapObjects.types';
import { boundsOf, doRectsOverlap } from '../utils/geometry';
import type { Rect } from '../utils/geometry.types';
import { MapGenerationError } from './MapGenerationError';

/** The size of the world a fort stands in, in world units. */
export type FortWorld = { readonly width: number; readonly height: number };

/** A fort in world units: its box and the thickness of its walls, per axis. */
export type FortInWorld = {
  readonly width: number;
  readonly height: number;
  readonly wallWidth: number;
  readonly wallHeight: number;
};

/**
 * A fort of `sketchSide` (sketch units, walls included) in world units. Forts are drawn in sketch
 * space and stretched per axis to the world, so each axis has its own side and wall thickness
 * (DEC-227). The wall is the side divided by `BUILDING_GEOMETRY.fort.wallDivisor`.
 */
export const fortInWorld = (sketchSide: number, world: FortWorld): FortInWorld => {
  const scaleX = world.width / SKETCH_WIDTH;
  const scaleY = world.height / SKETCH_HEIGHT;
  const wall = sketchSide / G.fort.wallDivisor;
  return {
    width: sketchSide * scaleX,
    height: sketchSide * scaleY,
    wallWidth: wall * scaleX,
    wallHeight: wall * scaleY,
  };
};

/** The wall roles of each band `fortWallBands` returns: the north wall, then the south wall. */
const BAND_ROLES: readonly (readonly FortWallRole[])[] = [['top'], ['bottom-left', 'bottom-right']];

/**
 * The north and south wall bands of a lane tower fort, read from the fort's own wall objects
 * (`walls`, its body: `MapFortificationBuilder`): the north wall, and the south wall's two pieces
 * with their doorway between them, so each band is the full width of the fort and one wall thick.
 * The lane runs through a fort's west and east doorways only (DEC-315), so no lane corridor holds
 * these bands (`LaneFlowFields`): the south doorway stays open to walking and A\*, not to a lane
 * field. There is no second calculation of the wall thickness: the objects are the source.
 */
export const fortWallBands = (walls: readonly MapObject[]): readonly Rect[] =>
  BAND_ROLES.flatMap((roles) => {
    const pieces = walls.filter(
      ({ fortWall }) => fortWall !== undefined && roles.includes(fortWall),
    );
    return pieces.length === 0
      ? []
      : [boundsOf(pieces.flatMap(({ footprints }) => footprints.flat()))];
  });

/**
 * The ground round every lane tower's fort that no blocking object of another building may take:
 * each fort's box grown by `fort.laneTowerClearance` on every side (DEC-315). A lane tower is a
 * feature whose definition `isCourt`, as `MatchGrid` reads it. The boxes are in sketch units (the
 * space scenery is placed in, `MapSceneryBuilder`) for `features` in sketch units; with `world`,
 * for `features` in world units, each box is stretched per axis to the world (DEC-227).
 */
export const laneFortKeepOuts = (
  features: readonly MapFeature[],
  world?: FortWorld,
): readonly Rect[] => {
  const side = G.fort.laneTowerSize + 2 * G.fort.laneTowerClearance;
  const width = world === undefined ? side : (side * world.width) / SKETCH_WIDTH;
  const height = world === undefined ? side : (side * world.height) / SKETCH_HEIGHT;
  return features
    .filter(({ definitionId }) => MAP_FEATURE_DEFINITIONS[definitionId]?.isCourt === true)
    .map(({ position: { x, y } }) => ({
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
    }));
};

/** Whether `box` overlaps any of `keepOuts` (`laneFortKeepOuts`). */
export const isInLaneFortKeepOut = (box: Rect, keepOuts: readonly Rect[]): boolean =>
  keepOuts.some((keepOut) => doRectsOverlap(box, keepOut));

/**
 * Checks that a navigation cell is finer than the thinnest lane tower fort wall, which
 * `WorldMap.isCourt` needs so that a step across a wall lands on a cell whose centre it covers.
 *
 * @throws MapGenerationError when `navCellSize` is not smaller than that wall.
 */
export const assertFortWallsResolve = (world: FortWorld, navCellSize: number): void => {
  const { wallWidth, wallHeight } = fortInWorld(G.fort.laneTowerSize, world);
  const wall = Math.min(wallWidth, wallHeight);
  if (navCellSize >= wall) {
    throw new MapGenerationError(
      `map.navCellSize = ${String(navCellSize)} is not smaller than the ${wall.toFixed(2)} unit wall of a lane tower fort at map.worldWidth = ${String(world.width)}, map.worldHeight = ${String(world.height)}; a navigation cell must be finer than a fort wall (use a smaller navCellSize or a larger world)`,
    );
  }
};
