/**
 * Map 1's scenery is authored in the 1600 x 900 sketch the preset was traced from;
 * `MapSceneryBuilder` stretches it to the generated world size.
 */
export const SKETCH_WIDTH = 1600;
/** Height of the sketch the scenery is authored in. */
export const SKETCH_HEIGHT = 900;

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
} as const;
