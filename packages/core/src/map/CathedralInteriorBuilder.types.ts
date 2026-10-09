import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';

/** The cathedral's explorable interior and the battlefield area that leads into it. */
export type CathedralInterior = {
  /** The interior as a small map: its size and its capture-point anchor. */
  readonly map: MapDefinition;
  /** The interior's presentation-only polygons, including its ground. */
  readonly scenery: readonly MapDecoration[];
  /** The cathedral's footprint on the battlefield, in world units; a click inside enters. */
  readonly entry: {
    readonly center: Vec2;
    readonly halfWidth: number;
    readonly halfHeight: number;
  };
};
