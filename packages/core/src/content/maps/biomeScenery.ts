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
