import type {
  MapFeatureKind,
  MapTerrainKind,
  MinimapColourRole,
  PlayableTeam,
} from '@eternalus/core';

import type { FeatureStyle } from './MapView.types';

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

/**
 * How each feature kind is drawn in the main view (sizes in world units). The lookup replaces
 * a `switch` on kind: a new kind is one line here and appears with no drawing code change.
 */
export const FEATURE_STYLES: Readonly<Record<MapFeatureKind, FeatureStyle>> = {
  stronghold: { shape: 'square', size: 50 },
  'spawner-tower': { shape: 'square', size: 28 },
  'buff-tower': { shape: 'diamond', size: 28 },
  'wall-segment': { shape: 'footprint', size: 0 },
  gate: { shape: 'footprint', size: 0 },
  turret: { shape: 'dot', size: 14 },
  camp: { shape: 'dot', size: 22 },
  'corner-camp': { shape: 'ring', size: 45 },
  'capture-point': { shape: 'ring', size: 30 },
  cathedral: { shape: 'diamond', size: 110 },
  obstacle: { shape: 'dot', size: 14 },
};

/**
 * Minimap colour for each glyph colour role. `team` glyphs use the owner's `TEAM_COLORS`; the
 * `team` entry here is only the fallback for a neutral feature marked with the team role.
 */
export const MINIMAP_ROLE_COLORS: Readonly<Record<MinimapColourRole, string>> = {
  team: '#ffffff',
  neutral: '#2f6b2a',
  objective: '#ff4040',
  terrain: '#e6d2a0',
  obstacle: '#3d5c2e',
};
