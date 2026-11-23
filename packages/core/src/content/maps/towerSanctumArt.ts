/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const TOWER_SANCTUM_GEOMETRY = {
  sanctumShadowBounds: [-30, -30, 64, 58] as const,
  sanctumPlinthBounds: [-32, -35, 64, 59] as const,
  sanctumOuterInlayBounds: [-30, -33, 60, 55] as const,
  sanctumFloorBounds: [-28, -31, 56, 51] as const,
  sanctumInnerInlayBounds: [-23, -26, 46, 41] as const,
  sanctumRecessBounds: [-21, -24, 42, 37] as const,
  sanctumWing: (side: number, x: number, y: number) =>
    [
      { x: side * 5, y: -5 },
      { x, y: y - 8 },
      { x: x + side * 2.4, y: y - 3 },
      { x: side * 9, y: -1 },
    ] as const,
  sanctumOrbitBounds: [0, -8, 14, 12] as const,
  sanctumOrbitInsetBounds: [0, -8, 12.5, 10.5] as const,
  sanctumAetherBounds: [0, -8, 10, 8] as const,
  sanctumFloatingShard: (side: number) =>
    [
      { x: side * 17, y: -14 },
      { x: side * 20, y: -9 },
      { x: side * 17, y: -4 },
      { x: side * 15, y: -9 },
    ] as const,
  sanctumStairBounds: (width: number, step: number) =>
    [-width / 2, 16 + step * 3, width, 3] as const,
  sanctumStairEdgeBounds: (width: number, step: number) =>
    [-width / 2, 16 + step * 3, width, 0.6] as const,
  shadowBounds: (x: number) => [x - 4, -29, 10, 38] as const,
  shaftBounds: (x: number) => [x - 4, -32, 8, 36] as const,
  fluteBounds: (x: number) => [x - 1, -28, 2, 28] as const,
  capitalBounds: (x: number, y: number) => [x - 6, y, 12, 4] as const,
  courseBounds: (x: number, course: number) => [x - 4, -25 + course * 6, 8, 0.6] as const,
} as const;
