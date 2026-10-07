/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
export { ConfigValidationError } from './config/ConfigValidationError';
export { createDefaultGameConfig } from './config/defaultGameConfig';
export type {
  DeepPartial,
  GameConfig,
  LimitsConfig,
  MapConfig,
  MatchConfig,
} from './config/GameConfig.types';
export { validateGameConfig } from './config/validateGameConfig';
export { MAP_1 } from './content/maps/map1';
export type {
  FeatureOwner,
  MapDefinition,
  MapFeature,
  MapFeatureKind,
  MapLane,
  MapTerrain,
  MapTerrainKind,
  TeamId,
} from './content/maps/maps.types';
export type { Polygon, Rect, Vec2 } from './utils/geometry.types';
