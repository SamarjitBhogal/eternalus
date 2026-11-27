/** DEC-238 tree silhouettes, retaining the approved trunk collider dimensions exactly. */
// TUNE: Provisional appearance values; changing the trunk is a gameplay geometry change.
export const BIOME_TREE_ART = {
  shadow: { x: 4, y: 6, height: 0.4 },
  trunk: { x: -1, width: 3, shortModulo: 3, short: 9, tall: 10 },
  fir: {
    tiers: 3,
    top: -1.5,
    step: 0.5,
    width: 0.4,
    widthStep: 0.16,
    height: 0.85,
    snow: [
      [0, 0],
      [0.8, 0.66],
      [0.15, 0.55],
      [-0.28, 0.69],
      [-0.78, 0.64],
    ],
    foot: { y: 9, rx: 5, ry: 2 },
  },
  charred: {
    crown: { baseY: 2, middleX: 1, middleY: -0.65, tipX: -2, tipY: -1.3 },
    crownWidth: 2.5,
    branch: [
      [0, -0.35],
      [0.5, -0.7],
      [0.7, -1],
    ],
    branchWidth: 1.8,
    twig: [
      [0.5, -0.7],
      [0.8, -0.67],
    ],
    twigWidth: 1,
    foot: { y: 8, rx: 6, ry: 2 },
  },
} as const;
