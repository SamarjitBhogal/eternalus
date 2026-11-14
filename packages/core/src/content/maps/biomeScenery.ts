import type { BiomeKind } from './maps.types';

/** DEC-238 approves these cosmetic profiles and their content-owned tuning. */
export const BIOME_PROFILES = {
  snow: {
    rowOrigin: 35,
    rowStep: 46,
    terraceModulo: 3,
    treeStyle: 'fir',
    groundStyle: 'ice',
    mountainSnow: true,
    mountainFissure: false,
    weatherDirection: 1,
    particleRadius: 0.0013,
    emberEvery: 0,
  },
  lava: {
    rowOrigin: 870,
    rowStep: -43,
    terraceModulo: 1,
    treeStyle: 'charred',
    groundStyle: 'fracture',
    mountainSnow: false,
    mountainFissure: true,
    weatherDirection: -1,
    particleRadius: 0.0009,
    emberEvery: 7,
  },
} as const satisfies Record<BiomeKind, object>;
/** Typed biome iteration avoids duplicating the vocabulary in builders. */
export const BIOME_KINDS: readonly BiomeKind[] = ['snow', 'lava'];
/** Shared cosmetic materials. */
export const BIOME_MATERIALS = {
  transparent: 'rgba(0,0,0,0)',
  treeShadow: 'rgba(18,29,32,0.25)',
  lavaThread: '#ffe3a1',
  lavaFlowDark: '#dc7035',
  lavaFlowLight: '#ffbd68',
} as const;

/** Sketch-space presentation regions; no damage, navigation or capture rules are attached. */
export const BIOME_REGIONS = {
  snow: { x: 800, y: 75, rx: 340, ry: 235 },
  lava: { x: 800, y: 835, rx: 350, ry: 225 },
} as const;

/** Blended soils, exposed rock and vegetation materials. */
export const BIOME_PALETTES = {
  snow: {
    fringe: 'rgba(169,193,187,0.12)',
    ground: '#c6d3cf',
    soil: '#d8e2da',
    surface: '#e2e9df',
    light: '#f3f5eb',
    shadow: '#78969b',
    rock: '#829a9f',
    rockLight: '#bed0cb',
    ice: '#7fb4bf',
    dark: '#486670',
    vegetation: '#394f50',
    twig: '#647879',
    accent: '#bce3e0',
  },
  lava: {
    fringe: 'rgba(77,61,49,0.13)',
    ground: '#55534a',
    soil: '#454745',
    surface: '#363b3b',
    light: '#77766b',
    shadow: '#262e30',
    rock: '#4b5050',
    rockLight: '#767570',
    ice: '#6d4632',
    dark: '#252d2e',
    vegetation: '#333735',
    twig: '#68604e',
    accent: '#e78842',
  },
} as const;

/** DEC-238 provisional ground presentation tuning; no gameplay effect. */
export const BIOME_GROUND_SETTINGS = {
  transitionLayers: 9,
  transitionX: 7,
  transitionY: 4,
  rows: 5,
  columns: 7,
  startX: 285,
  columnStep: 43,
  jitterX: 19,
  jitterY: 17,
  jitterOffsetX: 9,
  jitterOffsetY: 8,
  detailInset: 0.86,
  soilRadius: 27,
  soilVariation: 19,
  soilHeight: 12,
  soilHeightVariation: 10,
  slopeOffset: 3,
  slopeRadius: 23,
  slopeVariation: 16,
  slopeHeight: 8,
  slopeHeightVariation: 8,
  rimWidth: 1.2,
} as const;
