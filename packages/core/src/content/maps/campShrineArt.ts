/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const CAMP_SHRINE_GEOMETRY = {
  shadowBounds: [2, 17, 35, 13] as const,
  altarFootBounds: [0, 1, 12, 4] as const,
  altarFaceBounds: [-10, -5, 20, 6] as const,
  altarRimBounds: [0, -5, 12, 4] as const,
  altarTopBounds: [0, -6, 10, 3] as const,
  altarCarving: (x: number) =>
    [
      { x, y: -3 },
      { x: x + 2, y: 0 },
      { x, y: 2 },
      { x: x - 2, y: 0 },
    ] as const,
  fallenStone: (x: number, y: number) =>
    [
      { x, y },
      { x: x + 4, y: y - 1 },
      { x: x + 6, y: y + 2 },
      { x: x + 1, y: y + 3 },
    ] as const,
  face: (w: number, y: number) =>
    [
      { x: -w, y },
      { x: w, y },
      { x: w - 1, y: y + 4 },
      { x: -w + 1, y: y + 4 },
    ] as const,
  tread: (w: number, y: number) =>
    [
      { x: -w + 4, y: y - 6 },
      { x: w - 4, y: y - 6 },
      { x: w, y },
      { x: -w, y },
    ] as const,
  joint: (x: number, y: number) =>
    [
      { x, y: y - 5 },
      { x: x + 0.5, y: y - 5 },
      { x: x + 1.5, y },
      { x: x + 0.8, y },
    ] as const,
  shaft: (x: number) =>
    [
      { x: x - 3.7, y: -38 },
      { x: x + 3.7, y: -38 },
      { x: x + 4.5, y: -7 },
      { x: x - 4.5, y: -7 },
    ] as const,
  relief: (x: number, y: number) =>
    [
      { x, y: y + 1 },
      { x: x + 1.3, y: y + 2.5 },
      { x, y: y + 4 },
      { x: x - 1.3, y: y + 2.5 },
    ] as const,
  buttress: (x: number, side: number) =>
    [
      { x: x + side * 3, y: -21 },
      { x: x + side * 10, y: -4 },
      { x: x + side * 10, y: 7 },
      { x: x + side * 3, y: 5 },
    ] as const,
  buttressLight: (x: number, side: number) =>
    [
      { x: x + side * 3, y: -21 },
      { x: x + side * 5, y: -18 },
      { x: x + side * 11, y: 4 },
      { x: x + side * 9, y: 2 },
    ] as const,
  keystone: [
    { x: -3, y: -54 },
    { x: 0, y: -58 },
    { x: 3, y: -54 },
    { x: 2, y: -47 },
    { x: -2, y: -47 },
  ] as const,
  keystoneInlayBounds: [-0.6, -54, 1.2, 6] as const,
  archBrokenChip: [
    { x: -17, y: -40 },
    { x: -12, y: -43 },
    { x: -13, y: -39 },
  ] as const,
  lipBounds: (w: number, y: number) => [-w + 1, y, w * 2 - 2, 0.65] as const,
  lichenBounds: (x: number, y: number) => [x + 1, y - 4, 1.6, 0.7] as const,
  footBounds: (x: number) => [x - 5, -4, 10, 9] as const,
  footTopBounds: (x: number) => [x - 6, -7, 12, 4] as const,
  sideBounds: (x: number) => [x + 2, -37, 2.5, 30] as const,
  recessBounds: (x: number) => [x - 2, -34, 3.2, 23] as const,
  fluteBounds: (x: number) => [x - 2.4, -34, 0.65, 23] as const,
  capitalBounds: (x: number) => [x - 5, -39, 10, 3] as const,
  crownBounds: (x: number) => [x - 3, -42, 6, 3] as const,
  jointBounds: (x: number, y: number) => [x - 3.5, y, 7, 0.6] as const,
  mossBounds: (x: number, side: number) => [x + side * 4, -3, 3, 2] as const,
  outerArch: (side: number) =>
    [
      { x: side * 23, y: -20 },
      { x: side * 22, y: -32 },
      { x: side * 15, y: -43 },
      { x: side * 6, y: -48 },
      { x: 0, y: -53 },
    ] as const,
  innerArch: (side: number) =>
    [
      { x: side * 17, y: -20 },
      { x: side * 16, y: -31 },
      { x: side * 11, y: -39 },
      { x: side * 4, y: -44 },
      { x: 0, y: -47 },
    ] as const,
  marbleFleck: (x: number, y: number) =>
    [
      { x, y },
      { x: x + 1.6, y: y - 0.4 },
      { x: x + 1, y: y + 0.5 },
    ] as const,
  step: { baseY: 18, rise: 5, halfWidth: 32, taper: 4 },
  pillar: { sideOffset: 21, jointStart: -35, courseHeight: 5.6 },
  archTrim: { edgeWidth: 0.8, trimWidth: 0.7, jointWidth: 0.55 },
} as const;
