import type { FeatureOwner, MapFeatureKind, MapTerrainKind } from '@eternalus/core';

/** Colour of the playable ground. */
export const GROUND_COLOR = '#cc9f66';

/** Colour of the lane paths. */
export const LANE_COLOR = '#5a3f22';

/** Width of the lane paths in screen pixels. */
export const LANE_WIDTH = 1.5;

/** Colour of each kind of terrain shape. */
export const TERRAIN_COLORS: Readonly<Record<MapTerrainKind, string>> = {
  'out-of-bounds': '#6e6e6e',
  rift: '#960096',
  'capital-wall': '#e6d2a0',
};

/** Colour of team-owned features. Neutral features use `NEUTRAL_FEATURE_COLORS`. */
export const TEAM_COLORS: Readonly<Record<Exclude<FeatureOwner, 'neutral'>, string>> = {
  light: '#00d8ff',
  dark: '#4b0096',
};

/** Colour of neutral features, by kind. */
export const NEUTRAL_FEATURE_COLORS: Readonly<Record<MapFeatureKind, string>> = {
  capital: '#ffffff',
  'team-structure': '#ffffff',
  'capture-point': '#aa0000',
  cathedral: '#aa0000',
  crossing: '#aa0000',
  'side-objective': '#e68200',
};

/** Size of each kind of feature marker, in world units. */
export const FEATURE_SIZES: Readonly<Record<MapFeatureKind, number>> = {
  capital: 50,
  'team-structure': 30,
  'capture-point': 24,
  cathedral: 110,
  crossing: 45,
  'side-objective': 45,
};
