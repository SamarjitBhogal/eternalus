/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
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
export { LEGEND_CLASSES } from './content/legends/legendClasses';
export type {
  DamageFocus,
  DefaultActionId,
  LegendDefinition,
  LegendKind,
  PassiveId,
  PickUpStyle,
  WeaponBias,
} from './content/legends/legends.types';
export type { PlayableTeam, Team } from './teams/teams.types';
