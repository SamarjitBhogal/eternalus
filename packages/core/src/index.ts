/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
import { MAP_1 as MAP_1_LAYOUT } from './content/maps/map1';
import { MapLayout } from './map/MapLayout';

/** The enlarged, decorated battlefield; original authored anchors remain proportional. */
export const MAP_1 = new MapLayout().build(MAP_1_LAYOUT);
export type {
  FeatureOwner,
  MapDefinition,
  MapDecoration,
  MapFeature,
  MapFeatureKind,
  MapLane,
  MapTerrain,
  MapTerrainKind,
  TeamId,
} from './content/maps/maps.types';
export type { Polygon, Rect, Vec2 } from './utils/geometry.types';
