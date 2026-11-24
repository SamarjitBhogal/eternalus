/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const MINION_FIGURE_GEOMETRY = {
  legOffsetRatio: 0.55,
  bodyOutline: (w: number) =>
    [
      [-w, -0.7],
      [w, -0.7],
      [w + 0.16, 0.57],
      [0.08, 0.4],
      [-0.2, 0.67],
      [-w - 0.15, 0.5],
    ] as const,
  bodyPlate: (w: number) =>
    [
      [-w + 0.08, -0.62],
      [w - 0.08, -0.62],
      [w, 0.43],
      [0.05, 0.26],
      [-0.2, 0.5],
      [-w, 0.4],
    ] as const,
  shoulderOutline: (side: number, w: number, s: number) =>
    [
      [side * w * 0.7, -0.89],
      [side * s, -0.91],
      [side * (s + 0.1), -0.47],
      [side * w, -0.25],
    ] as const,
  shoulderPlate: (side: number, w: number, s: number) =>
    [
      [side * w * 0.72, -0.8],
      [side * (s - 0.07), -0.82],
      [side * s, -0.51],
      [side * w, -0.4],
    ] as const,
  breastplateOutline: (w: number) =>
    [
      [-w, -0.78],
      [0, -0.94],
      [w, -0.78],
      [w * 0.77, 0.13],
      [-w * 0.77, 0.13],
    ] as const,
  breastplateInset: (w: number) =>
    [
      [-w + 0.08, -0.68],
      [0, -0.83],
      [w - 0.08, -0.68],
      [w * 0.65, 0.03],
      [-w * 0.65, 0.03],
    ] as const,
  chestTrim: (w: number) =>
    [
      [-w + 0.12, -0.65],
      [0, -0.79],
      [w - 0.12, -0.65],
      [0, -0.37],
    ] as const,
  chestGem: [
    [0, -0.67],
    [0.12, -0.47],
    [0, -0.22],
    [-0.12, -0.47],
  ] as const,
  armOutline: (side: number) =>
    [
      [side * 0.49, -0.37],
      [side * 0.75, -0.23],
      [side * 1.01, 0.42],
      [side * 0.65, 0.05],
    ] as const,
  armPlate: (side: number) =>
    [
      [side * 0.58, -0.23],
      [side * 0.71, -0.17],
      [side * 0.91, 0.25],
      [side * 0.66, 0],
    ] as const,
  helmetCrest: [
    [-0.31, -1.33],
    [0, -1.66],
    [0.31, -1.33],
    [0.22, -1.22],
    [0, -1.45],
    [-0.22, -1.22],
  ] as const,
  swordArm: [
    [0.26, -0.84],
    [0.47, -0.75],
    [0.72, 0.2],
    [0.48, 0.06],
  ] as const,
  swordBlade: [
    [0.75, -0.16],
    [0.91, -1.67],
    [1.05, -1.95],
    [1.17, -1.64],
    [0.99, -0.11],
  ] as const,
  swordEdge: [
    [0.87, -0.26],
    [1.01, -1.65],
    [1.06, -1.78],
    [1.08, -1.62],
    [0.99, -0.22],
  ] as const,
  shieldOutline: [
    [-1.2, -0.76],
    [-0.49, -0.83],
    [-0.42, 0.09],
    [-0.78, 0.55],
    [-1.17, 0.15],
  ] as const,
  shieldPlate: [
    [-1.1, -0.67],
    [-0.57, -0.72],
    [-0.52, 0.05],
    [-0.78, 0.4],
    [-1.07, 0.1],
  ] as const,
  shieldInset: [
    [-1.01, -0.57],
    [-0.65, -0.61],
    [-0.62, 0.01],
    [-0.78, 0.23],
    [-0.96, 0.02],
  ] as const,
  daggerTip: (side: number) =>
    [
      [side * 0.79, -0.88],
      [side * 1.08, -1.2],
      [side * 1.25, -0.66],
    ] as const,
  maulHead: [
    [0.72, -1.57],
    [1.5, -1.57],
    [1.6, -1.3],
    [1.5, -0.92],
    [0.72, -0.92],
    [0.62, -1.3],
  ] as const,
  shinOutlineBounds: (x: number) => [x - 0.18, 0.1, 0.36, 0.66] as const,
  shinPlateBounds: (x: number) => [x - 0.12, 0.14, 0.24, 0.4] as const,
  footBounds: (x: number) => [x - 0.15, 0.6, 0.33, 0.13] as const,
  shoulderTrimBounds: (side: number, s: number) =>
    [side * (s - 0.12) - 0.07, -0.65, 0.14, 0.07] as const,
  beltBounds: (w: number) => [-w * 0.8, 0.02, w * 1.6, 0.13] as const,
  buckleBounds: [-0.11, 0, 0.22, 0.18] as const,
  daggerHandBounds: (side: number) => [side * 0.61 - 0.1, -0.37, 0.2, 0.18] as const,
  swordGuardBounds: [0.69, -0.28, 0.47, 0.11] as const,
  swordGripBounds: [0.87, -0.14, 0.13, 0.36] as const,
  shieldVerticalInlayBounds: [-0.84, -0.5, 0.1, 0.6] as const,
  shieldCrossInlayBounds: [-1, -0.3, 0.42, 0.09] as const,
  fistOutlineBounds: (side: number) => [side * 0.93 - 0.16, -0.3, 0.32, 0.32] as const,
  fistPlateBounds: (side: number) => [side * 0.93 - 0.1, -0.25, 0.2, 0.22] as const,
  maulHandleOutlineBounds: [1.04, -1.05, 0.16, 1.8] as const,
  maulHandleBounds: [1.08, -1.02, 0.07, 1.7] as const,
  maulFaceBounds: [0.77, -1.47, 0.68, 0.44] as const,
  maulHighlightBounds: [0.79, -1.47, 0.63, 0.1] as const,
  maulBandBounds: [1.02, -1.47, 0.13, 0.44] as const,
} as const;
