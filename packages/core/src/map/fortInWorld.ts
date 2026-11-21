import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { SKETCH_HEIGHT, SKETCH_WIDTH } from '../content/maps/map1Scenery';
import type { MapFeature } from '../content/maps/maps.types';
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

/**
 * The north and south wall bands of the lane tower fort whose box is `box` (world units): the full
 * width of the box, one wall thick (`fortInWorld`). The lane runs through a fort's west and east
 * doorways only (DEC-315), so no lane corridor holds these bands (`LaneFlowFields`): the south
 * doorway stays open to walking and A\*, not to a lane field.
 */
export const fortWallBands = (box: Rect, world: FortWorld): readonly Rect[] => {
  const { wallHeight } = fortInWorld(G.fort.laneTowerSize, world);
  return [
    { x: box.x, y: box.y, width: box.width, height: wallHeight },
    { x: box.x, y: box.y + box.height - wallHeight, width: box.width, height: wallHeight },
  ];
};

/**
 * The ground round every lane tower's fort that no blocking object of another building may take,
 * in sketch units (the space scenery is placed in, `MapSceneryBuilder`): each fort's box grown by
 * `fort.laneTowerClearance` on every side (DEC-315). A lane tower is a feature whose definition
 * `isCourt`, as `MatchGrid` reads it.
 */
export const laneFortKeepOuts = (features: readonly MapFeature[]): readonly Rect[] => {
  const side = G.fort.laneTowerSize + 2 * G.fort.laneTowerClearance;
  return features
    .filter(({ definitionId }) => MAP_FEATURE_DEFINITIONS[definitionId]?.isCourt === true)
    .map(({ position: { x, y } }) => ({
      x: x - side / 2,
      y: y - side / 2,
      width: side,
      height: side,
    }));
};

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
