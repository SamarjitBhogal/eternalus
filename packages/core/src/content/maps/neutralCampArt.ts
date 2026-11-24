/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const NEUTRAL_CAMP_GEOMETRY = {
  mushroomCount: 9,
  mushroomPosition: (index: number) => ({ x: -20 + index * 5, y: 15 + (index % 3) }),
  standingStones: [
    [0, -19, -3, 18],
    [1, 17, -5, 22],
    [2, -9, 12, 9],
    [3, 15, 11, 8],
  ],
  dolmenCrackWidth: 0.7,
  rootWidth: 1.5,
  campClearingBounds: [0, 0, 27, 20] as const,
  forestMossBounds: [-2, 0, 24, 17] as const,
  face: (x: number, y: number, height: number) =>
    [
      { x: x - 3, y },
      { x: x - 4, y: y - height + 4 },
      { x, y: y - height },
      { x: x + 4, y: y - height + 3 },
      { x: x + 5, y },
    ] as const,
  facet: (x: number, y: number, height: number) =>
    [
      { x, y: y - height },
      { x: x + 4, y: y - height + 3 },
      { x: x + 5, y },
      { x: x + 1, y },
    ] as const,
  dolmenCap: [
    { x: -12, y: -16 },
    { x: 8, y: -18 },
    { x: 13, y: -13 },
    { x: 10, y: -10 },
    { x: -11, y: -10 },
  ] as const,
  dolmenCrack: [
    { x: -3, y: -16 },
    { x: -1, y: -13 },
    { x: -4, y: -10 },
  ] as const,
  offeringBowlBounds: [0, 2, 6, 3] as const,
  offeringWaterBounds: [0, 1, 4, 1.5] as const,
  root: (side: number) =>
    [
      { x: side * 24, y: -9 },
      { x: side * 16, y: 0 },
      { x: side * 12, y: 7 },
      { x: side * 4, y: 12 },
    ] as const,
  shadowBounds: (x: number, y: number) => [x + 2, y + 2, 6, 3] as const,
  footBounds: (x: number, y: number) => [x, y, 4, 2.5] as const,
  runeBounds: (x: number, y: number, height: number) => [x - 0.5, y - height + 6, 1, 5] as const,
  lichenBounds: (x: number, y: number) => [x - 2, y - 2, 3, 2] as const,
  dolmenLegBounds: (side: number) => [side * 7 - 2, -10, 4, 5] as const,
  lanternPostBounds: (side: number) => [side * 23, -11, 0.8, 13] as const,
  lanternGlowBounds: (side: number) => [side * 23, -11, 4, 5] as const,
  lanternCageBounds: (side: number) => [side * 23 - 1.5, -13, 3, 4] as const,
  lanternLightBounds: (side: number) => [side * 23 - 0.6, -12, 1.2, 2] as const,
  mushroomStemBounds: (x: number, y: number) => [x, y, 0.6, 2] as const,
  mushroomCapBounds: (x: number, y: number) => [x + 0.3, y, 1.3, 0.8] as const,
} as const;
