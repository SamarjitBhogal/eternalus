import type { RuinArtwork } from './ObjectRuinsView.types';
import { RUIN_GROUND, RUIN_PALETTE as P } from './ruinMaterials';
/** Authored timber remains, normalized to its footprint. */
export const TIMBER_RUIN: RuinArtwork = {
  pieces: [
    RUIN_GROUND,
    {
      color: P.bark,
      points: [
        [0.1, 0.8],
        [0.16, 0.67],
        [0.87, 0.24],
        [0.92, 0.35],
      ],
    },
    {
      color: P.cutWood,
      points: [
        [0.18, 0.3],
        [0.25, 0.24],
        [0.83, 0.85],
        [0.74, 0.91],
      ],
    },
    {
      color: P.barkLight,
      points: [
        [0.25, 0.6],
        [0.3, 0.4],
        [0.43, 0.37],
        [0.37, 0.65],
      ],
    },
    {
      color: P.metal,
      points: [
        [0.68, 0.53],
        [0.77, 0.48],
        [0.82, 0.62],
        [0.72, 0.66],
      ],
    },
  ],
};

/** Authored tent remains, normalized to its footprint. */
export const TENT_RUIN: RuinArtwork = {
  pieces: [
    RUIN_GROUND,
    {
      color: P.canvas,
      points: [
        [0.1, 0.7],
        [0.4, 0.32],
        [0.57, 0.57],
        [0.83, 0.42],
        [0.93, 0.89],
        [0.32, 0.94],
      ],
    },
    {
      color: P.bark,
      points: [
        [0.2, 0.92],
        [0.17, 0.85],
        [0.71, 0.16],
        [0.75, 0.19],
      ],
    },
    {
      color: P.char,
      points: [
        [0.39, 0.61],
        [0.52, 0.52],
        [0.54, 0.7],
        [0.46, 0.8],
      ],
    },
  ],
};

/** Authored gate remains, normalized to its footprint. */
export const GATE_RUIN: RuinArtwork = {
  pieces: [
    RUIN_GROUND,
    {
      color: P.bark,
      points: [
        [0.05, 0.18],
        [0.19, 0.18],
        [0.24, 0.91],
        [0.08, 0.96],
      ],
    },
    {
      color: P.cutWood,
      points: [
        [0.05, 0.18],
        [0.11, 0.07],
        [0.19, 0.18],
      ],
    },
    {
      color: P.bark,
      points: [
        [0.8, 0.43],
        [0.93, 0.31],
        [0.96, 0.91],
        [0.82, 0.95],
      ],
    },
    {
      color: P.barkLight,
      points: [
        [0.2, 0.67],
        [0.27, 0.53],
        [0.77, 0.81],
        [0.72, 0.94],
      ],
    },
    {
      color: P.bark,
      points: [
        [0.28, 0.85],
        [0.32, 0.72],
        [0.76, 0.48],
        [0.8, 0.58],
      ],
    },
    {
      color: P.metal,
      points: [
        [0.3, 0.61],
        [0.4, 0.61],
        [0.65, 0.87],
        [0.55, 0.88],
      ],
    },
  ],
};
