/**
 * Public API of `@eternalus/core`. Other packages may import only from here.
 * Anything not exported from this file is internal to the simulation.
 */
import type { PlayableTeam, Team } from './teams/teams.types';

export { LEGEND_CLASSES } from './content/legends/legendCatalogue';
export type {
  DamageFocus,
  DefaultActionId,
  LegendDefinition,
  LegendKind,
  PassiveId,
  PickUpStyle,
  WeaponBias,
} from './content/legends/legends.types';
export { DEFAULT_MAP_CONFIG } from './content/maps/defaultMapConfig';
export type {
  MapDefinition,
  MapFeature,
  MapFeatureKind,
  MapLane,
  MapTerrain,
  MapTerrainKind,
  MinimapColourRole,
  MinimapGlyph,
  MinimapGlyphShape,
} from './content/maps/maps.types';
export { MapGenerator } from './map/MapGenerator';
export type { MapConfig, MapGeneratorConfig } from './map/MapGenerator.types';
export type { PlayableTeam, Team } from './teams/teams.types';
export type { Polygon, Rect, Vec2 } from './utils/geometry.types';

/**
 * The two playable teams.
 *
 * @deprecated Use `PlayableTeam`. Kept for one release for code written against `feat/map`.
 */
export type TeamId = PlayableTeam;

/**
 * Who owns a map feature when the match starts.
 *
 * @deprecated Use `Team`. Kept for one release for code written against `feat/map`.
 */
export type FeatureOwner = Team;
