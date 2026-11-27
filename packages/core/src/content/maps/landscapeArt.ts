import type { Vec2 } from '../../utils/geometry.types';

/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const MAP_LANDSCAPE_GEOMETRY = {
  lava: {
    weatheringBase: 28,
    weatheringStep: 9,
    bankWidth: 34,
    riverWidth: 23,
    flowWidth: 14,
    coreWidth: 5,
    hotThreadWidth: 1.6,
    viscousWidth: 1.1,
    viscousOffset: { x: 4, y: 2 },
  },
  bridge: {
    shadow: [-19, -22, 42, 49],
    deck: [-16, -24, 32, 48],
    joint: (plank: number) => [-13, -21 + plank * 6, 26, 1] as const,
    westRail: [-17, -25, 4, 50],
    eastRail: [13, -25, 4, 50],
  },
  lakeRipple: (lake: Vec2, j: number) =>
    [
      { x: lake.x - 20 + j * 7, y: lake.y - 15 + j * 7 },
      { x: lake.x + 15 + j * 4, y: lake.y - 17 + j * 7 },
    ] as const,
  snowPocketBounds: (
    patch: { readonly x: number; readonly y: number; readonly rx: number; readonly ry: number },
    edge: number,
  ) => [patch.x, patch.y, patch.rx + edge * 5, patch.ry + edge * 2] as const,
  lavaCrustBounds: (x: number, n: number, y: number) =>
    [x + (n % 9) - 4, y + ((n >>> 4) % 7) - 3, 2 + (n % 4), 1.3 + (n % 3)] as const,
  lakeShoreBounds: (lake: {
    readonly x: number;
    readonly y: number;
    readonly rx: number;
    readonly ry: number;
  }) => [lake.x, lake.y, lake.rx + 9, lake.ry + 6] as const,
  lakeShallowsBounds: (lake: {
    readonly x: number;
    readonly y: number;
    readonly rx: number;
    readonly ry: number;
  }) => [lake.x, lake.y, lake.rx, lake.ry] as const,
  lakeDeepBounds: (lake: {
    readonly x: number;
    readonly y: number;
    readonly rx: number;
    readonly ry: number;
  }) => [lake.x + 4, lake.y + 3, lake.rx * 0.79, lake.ry * 0.75] as const,
  groundFleckBounds: (x: number, y: number, n: number) =>
    [x, y, 9 + (n % 12), 4 + (n % 6)] as const,
  bridges: [
    [0, 800, 741, false],
    [1, 815, 860, false],
    [2, 656, 788, true],
    [3, 950, 790, true],
  ] as const,
} as const;
