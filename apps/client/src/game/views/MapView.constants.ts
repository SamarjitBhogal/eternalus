import type { FeatureOwner, MapFeatureKind, MapTerrainKind } from '@eternalus/core';

/** Colour of the playable ground. */
export const GROUND_COLOR = '#596345';

/** Colour of the lane paths. */
export const LANE_COLOR = '#9a8b6d';

/** Width of the lane paths in screen pixels. */
export const LANE_WIDTH = 5;

/** Colour of each kind of terrain shape. */
export const TERRAIN_COLORS: Readonly<Record<MapTerrainKind, string>> = {
  'out-of-bounds': '#293731',
  rift: '#252b2c',
  'capital-wall': '#aaa58e',
};

/** Colour of team-owned features. Neutral features use `NEUTRAL_FEATURE_COLORS`. */
export const TEAM_COLORS: Readonly<Record<Exclude<FeatureOwner, 'neutral'>, string>> = {
  light: '#6db9bc',
  dark: '#aa718f',
};

/** Colour of neutral features, by kind. */
export const NEUTRAL_FEATURE_COLORS: Readonly<Record<MapFeatureKind, string>> = {
  camp: '#d5b77b',
  capital: '#ffffff',
  'team-structure': '#ffffff',
  'capture-point': '#aa0000',
  cathedral: '#aa0000',
  crossing: '#aa0000',
  'side-objective': '#e68200',
};

/** Size of each kind of feature marker, in world units. */
export const FEATURE_SIZES: Readonly<Record<MapFeatureKind, number>> = {
  camp: 26,
  capital: 50,
  'team-structure': 30,
  'capture-point': 45,
  cathedral: 110,
  crossing: 45,
  'side-objective': 45,
};
