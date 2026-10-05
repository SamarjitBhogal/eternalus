import type { MapFeatureKind, MapTerrainKind, PlayableTeam } from '@eternalus/core';

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
};

/** Colour of team-owned features. Neutral features use `NEUTRAL_FEATURE_COLORS`. */
export const TEAM_COLORS: Readonly<Record<PlayableTeam, string>> = {
  light: '#00d8ff',
  dark: '#4b0096',
};

/** Colour of neutral features, by kind. */
export const NEUTRAL_FEATURE_COLORS: Readonly<Record<MapFeatureKind, string>> = {
  stronghold: '#ffffff',
  'spawner-tower': '#ffffff',
  'buff-tower': '#ffffff',
  'wall-segment': '#e6d2a0',
  gate: '#e6d2a0',
  turret: '#ffffff',
  camp: '#2f6b2a',
  'corner-camp': '#e68200',
  'capture-point': '#aa0000',
  cathedral: '#aa0000',
  obstacle: '#3d5c2e',
};

/** Size of each kind of feature marker, in world units. */
export const FEATURE_SIZES: Readonly<Record<MapFeatureKind, number>> = {
  stronghold: 50,
  'spawner-tower': 30,
  'buff-tower': 26,
  'wall-segment': 12,
  gate: 16,
  turret: 10,
  camp: 22,
  'corner-camp': 45,
  'capture-point': 24,
  cathedral: 110,
  obstacle: 12,
};
