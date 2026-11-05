import type { RuinArtwork } from './ObjectRuinsView.types';
import { RUIN_GROUND, RUIN_PALETTE as P } from './ruinMaterials';
/** Authored rock remains, normalized to its footprint. */
export const ROCK_RUIN: RuinArtwork = {
  pieces: [
    RUIN_GROUND,
    {
      color: P.stoneDark,
      points: [
        [0.12, 0.38],
        [0.26, 0.25],
        [0.43, 0.33],
        [0.39, 0.57],
        [0.18, 0.59],
      ],
    },
    {
      color: P.stoneLight,
      points: [
        [0.12, 0.38],
        [0.26, 0.25],
        [0.43, 0.33],
        [0.25, 0.42],
      ],
    },
    {
      color: P.stone,
      points: [
        [0.55, 0.54],
        [0.77, 0.43],
        [0.92, 0.61],
        [0.83, 0.85],
        [0.59, 0.81],
      ],
    },
    {
      color: P.stoneLight,
      points: [
        [0.55, 0.54],
        [0.77, 0.43],
        [0.85, 0.57],
        [0.66, 0.64],
      ],
    },
    {
      color: P.stone,
      points: [
        [0.48, 0.12],
        [0.62, 0.04],
        [0.7, 0.2],
        [0.57, 0.3],
      ],
    },
    {
      color: P.stoneDark,
      points: [
        [0.07, 0.82],
        [0.17, 0.67],
        [0.29, 0.78],
        [0.24, 0.96],
      ],
    },
    {
      color: P.stoneLight,
      points: [
        [0.37, 0.74],
        [0.46, 0.69],
        [0.48, 0.83],
        [0.4, 0.88],
      ],
    },
    {
      color: P.stone,
      points: [
        [0.88, 0.2],
        [0.98, 0.3],
        [0.89, 0.37],
      ],
    },
  ],
};

/** Authored wall remains, normalized to its footprint. */
export const WALL_RUIN: RuinArtwork = {
  pieces: [
    RUIN_GROUND,
    {
      color: P.stoneDark,
      points: [
        [0.03, 0.76],
        [0.06, 0.28],
        [0.23, 0.28],
        [0.25, 0.53],
        [0.41, 0.58],
        [0.45, 0.9],
      ],
    },
    {
      color: P.stone,
      points: [
        [0.05, 0.3],
        [0.18, 0.18],
        [0.23, 0.28],
        [0.12, 0.44],
      ],
    },
    {
      color: P.stone,
      points: [
        [0.68, 0.59],
        [0.75, 0.18],
        [0.94, 0.12],
        [0.98, 0.81],
        [0.7, 0.94],
      ],
    },
    {
      color: P.stoneLight,
      points: [
        [0.75, 0.18],
        [0.88, 0.08],
        [0.94, 0.12],
        [0.84, 0.3],
      ],
    },
    {
      color: P.stoneLight,
      points: [
        [0.36, 0.78],
        [0.49, 0.59],
        [0.62, 0.68],
        [0.56, 0.93],
      ],
    },
  ],
};

/** Authored tower remains, normalized to its footprint. */
export const TOWER_RUIN: RuinArtwork = {
  pieces: [
    ...ROCK_RUIN.pieces,
    {
      color: P.stoneDark,
      points: [
        [0.17, 0.7],
        [0.12, 0.36],
        [0.25, 0.12],
        [0.42, 0.09],
        [0.48, 0.29],
        [0.36, 0.35],
        [0.29, 0.65],
      ],
    },
    {
      color: P.stone,
      points: [
        [0.61, 0.7],
        [0.72, 0.27],
        [0.88, 0.22],
        [0.94, 0.49],
        [0.86, 0.82],
      ],
    },
  ],
};
