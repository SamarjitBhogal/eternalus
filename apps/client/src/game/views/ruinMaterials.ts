import type { RuinPiece } from './ObjectRuinsView.types';
/** Shared wreckage materials; fire and smoke are cosmetic. */
export const RUIN_PALETTE = {
  shadow: 'rgba(28,28,22,0.28)',
  bark: '#57422f',
  barkLight: '#806044',
  cutWood: '#c29b68',
  woodRing: '#927047',
  foliage: '#4d5b38',
  char: '#332e29',
  stone: '#79786a',
  stoneLight: '#aaa18a',
  stoneDark: '#55584f',
  plaster: '#b6a58a',
  tile: '#79534a',
  canvas: '#94836a',
  metal: '#777e7b',
  ember: '#b64e25',
  flame: '#e58b35',
  flameCore: '#f5d57d',
  smoke: 'rgba(61,59,53,0.32)',
} as const;
const P = RUIN_PALETTE;
/** Shared ground shadow under each kind of wreckage. */
export const RUIN_GROUND: RuinPiece = {
  color: P.shadow,
  points: [
    [0.02, 0.7],
    [0.15, 0.44],
    [0.78, 0.42],
    [1, 0.78],
    [0.8, 0.98],
    [0.12, 0.95],
  ],
};
