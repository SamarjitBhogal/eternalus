/** TUNE: presentation scale requested by the map owner; all original anchors are preserved. */
export const MAP_1_SCALE = 8;

/** Authored neutral camp clearings. Enemies and collision belong to the future simulation. */
export const CAMP_POSITIONS = [
  { x: 350, y: 370 },
  { x: 490, y: 290 },
  { x: 660, y: 260 },
  { x: 350, y: 540 },
  { x: 490, y: 610 },
  { x: 660, y: 660 },
  { x: 1250, y: 370 },
  { x: 1110, y: 290 },
  { x: 940, y: 260 },
  { x: 1250, y: 540 },
  { x: 1110, y: 610 },
  { x: 940, y: 660 },
] as const;

/** Earth, stone, timber and restrained faction accents for the authored environment. */
export const MAP_PALETTE = {
  ground: '#596345',
  grass: '#65704c',
  shadow: '#28332d',
  stone: '#a6a18b',
  stoneDark: '#555c59',
  road: '#9a8b6d',
  roof: '#665149',
  roofLight: '#9b7960',
  bark: '#604b36',
  pine: '#304c3d',
  pineLight: '#4c6950',
  snow: '#cbd6d2',
  snowLight: '#e3e8df',
  snowShadow: '#899f9f',
  basalt: '#494440',
  ash: '#696157',
  lava: '#dc7036',
  lavaLight: '#ffbb63',
  light: '#6db9bc',
  dark: '#aa718f',
  gold: '#d5b77b',
} as const;

/** TUNE: deterministic decorative density; these settings have no gameplay effect. */
export const SCENERY_SETTINGS = {
  gridStep: 22,
  margin: 25,
  laneClearance: 18,
  featureClearance: 62,
  campClearance: 30,
  cityLeft: 660,
  cityRight: 940,
  cityTop: 330,
  cityBottom: 570,
} as const;
