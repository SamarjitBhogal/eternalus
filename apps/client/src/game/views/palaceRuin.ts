import type { RuinArtwork } from './ObjectRuinsView.types';
import { RUIN_GROUND, RUIN_PALETTE as P } from './ruinMaterials';
import { WALL_RUIN } from './stoneRuins';
import { TIMBER_RUIN } from './timberRuins';
/** Authored palace remains, normalized to its footprint. */
export const PALACE_RUIN: RuinArtwork = {
  pieces: [
    ...WALL_RUIN.pieces,
    {
      color: P.char,
      points: [
        [0.21, 0.51],
        [0.49, 0.28],
        [0.79, 0.49],
        [0.73, 0.86],
        [0.24, 0.88],
      ],
    },
    {
      color: P.tile,
      points: [
        [0.3, 0.54],
        [0.46, 0.36],
        [0.64, 0.51],
        [0.58, 0.71],
      ],
    },
    // The palace already has WALL_RUIN's ground; take only the timber debris on top of it.
    ...TIMBER_RUIN.pieces.filter((piece) => piece !== RUIN_GROUND),
  ],
};
