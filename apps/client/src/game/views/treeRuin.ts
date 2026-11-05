import type { RuinArtwork } from './ObjectRuinsView.types';
import { RUIN_GROUND, RUIN_PALETTE as P } from './ruinMaterials';
/** Authored tree remains, normalized to its footprint. */
export const TREE_RUIN: RuinArtwork = {
  widthToHeight: 2.2,
  anchorX: 0.25,
  pieces: [
    RUIN_GROUND,
    {
      color: P.bark,
      points: [
        [0.19, 0.55],
        [0.31, 0.55],
        [0.33, 0.92],
        [0.27, 1],
        [0.16, 0.93],
      ],
    },
    {
      color: P.cutWood,
      points: [
        [0.15, 0.57],
        [0.21, 0.5],
        [0.3, 0.51],
        [0.34, 0.59],
        [0.29, 0.65],
        [0.2, 0.65],
      ],
    },
    {
      color: P.woodRing,
      points: [
        [0.21, 0.56],
        [0.28, 0.55],
        [0.3, 0.59],
        [0.27, 0.62],
        [0.22, 0.61],
      ],
    },
    {
      color: P.cutWood,
      points: [
        [0.23, 0.58],
        [0.27, 0.57],
        [0.28, 0.6],
        [0.24, 0.6],
      ],
    },
    {
      color: P.bark,
      points: [
        [0.4, 0.77],
        [0.43, 0.55],
        [0.93, 0.23],
        [1, 0.39],
        [0.94, 0.5],
        [0.49, 0.86],
      ],
    },
    {
      color: P.barkLight,
      points: [
        [0.46, 0.58],
        [0.94, 0.26],
        [0.97, 0.34],
        [0.46, 0.72],
      ],
    },
    {
      color: P.cutWood,
      points: [
        [0.4, 0.74],
        [0.43, 0.6],
        [0.48, 0.65],
        [0.5, 0.79],
        [0.46, 0.86],
      ],
    },
    {
      color: P.bark,
      points: [
        [0.72, 0.45],
        [0.67, 0.18],
        [0.71, 0.21],
        [0.77, 0.46],
      ],
    },
    {
      color: P.foliage,
      points: [
        [0.81, 0.2],
        [0.88, 0.04],
        [0.98, 0.13],
        [0.94, 0.24],
      ],
    },
  ],
};
