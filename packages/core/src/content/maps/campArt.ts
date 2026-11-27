/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const MAP_CAMP_GEOMETRY = {
  mediumSpearCount: 3,
  mediumSpearOffset: (x: number, index: number) => x - 4 + index * 4,
  campClearingBounds: [0, 13, 39, 17] as const,
  crystalAuraBounds: [0, -18, 12, 16] as const,
  crystalPoolBounds: [0, -6, 6, 1.6] as const,
  crystalDark: [
    { x: 0, y: -31 },
    { x: 4, y: -21 },
    { x: 0, y: -10 },
    { x: -4, y: -21 },
  ] as const,
  crystalLight: [
    { x: 0, y: -29 },
    { x: 2.5, y: -21 },
    { x: 0, y: -13 },
    { x: -1.2, y: -21 },
  ] as const,
  crystalCage: (side: number) =>
    [
      { x: 0, y: -34 },
      { x: side * 5.5, y: -25 },
      { x: side * 5, y: -16 },
      { x: 0, y: -8 },
    ] as const,
  suspensionChainBounds: [-0.35, -47, 0.7, 14] as const,
  heavyShield: (x: number) =>
    [
      { x: x - 6, y: -15 },
      { x: x + 6, y: -15 },
      { x: x + 5, y: -4 },
      { x, y: 1 },
      { x: x - 5, y: -4 },
    ] as const,
  heavyShieldInset: (x: number) =>
    [
      { x: x - 4, y: -13 },
      { x: x + 4, y: -13 },
      { x: x + 3, y: -5 },
      { x, y: -1 },
      { x: x - 3, y: -5 },
    ] as const,
  mediumBlade: (offset: number, i: number) =>
    [
      { x: offset - 1.5, y: -20 - i * 2 },
      { x: offset + 0.4, y: -27 - i * 2 },
      { x: offset + 2, y: -20 - i * 2 },
    ] as const,
  lightBow: (x: number, side: number) =>
    [
      { x, y: -22 },
      { x: x + side * 6, y: -14 },
      { x: x + side * 6, y: -7 },
      { x, y: 1 },
    ] as const,
  chainLinkBounds: (link: number) => [0, -45 + link * 2, 1, 0.7] as const,
  heavyRackBounds: (x: number) => [x - 3, -5, 6, 10] as const,
  heavyShieldSpineBounds: (x: number) => [x - 0.7, -13, 1.4, 12] as const,
  heavyHammerHandleBounds: (x: number, side: number) => [x + side * 6, -18, 1.3, 19] as const,
  heavyHammerHeadBounds: (x: number, side: number) => [x + side * 6 - 3, -19, 7, 4] as const,
  mediumRackBounds: (x: number) => [x - 5, -2, 10, 3] as const,
  mediumSpearBounds: (offset: number, i: number) => [offset, -20 - i * 2, 0.8, 22] as const,
  mediumBucklerBounds: (x: number) => [x, -5, 4.5, 5] as const,
  mediumBucklerBossBounds: (x: number) => [x, -5, 1.7, 2] as const,
  lightQuiverBounds: (x: number) => [x - 3, -7, 6, 8] as const,
  lightBowstringBounds: (x: number) => [x, -22, 0.4, 23] as const,
  lightArrowBounds: (x: number, arrow: number) => [x - 2 + arrow * 2, -15, 0.5, 10] as const,
  lightFletchingBounds: (x: number, arrow: number) => [x - 2.7 + arrow * 2, -15, 1.7, 3] as const,
  equipmentOffset: 28,
  crystalCageWidth: 0.8,
  lightBowWidth: 1.1,
} as const;
