import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { SKETCH_HEIGHT, SKETCH_WIDTH } from '../content/maps/map1Scenery';

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
