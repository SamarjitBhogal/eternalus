import type { Vec2 } from '../../utils/geometry.types';

/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const MAP_MOUNTAIN_GEOMETRY = {
  sunFace: (point: (x: number, y: number) => Vec2, peak: Vec2) =>
    [point(-1, 0.55), point(-0.55, -0.4), peak, point(-0.1, 0.1), point(-0.32, 0.66)] as const,
  middleFace: (peak: Vec2, shoulder: Vec2, point: (x: number, y: number) => Vec2) =>
    [peak, shoulder, point(0.36, 0.48), point(-0.1, 0.1)] as const,
  shadowFace: (shoulder: Vec2, point: (x: number, y: number) => Vec2) =>
    [shoulder, point(0.81, -0.05), point(1, 0.55), point(0.35, 0.75), point(0.36, 0.48)] as const,
  brokenRidge: (peak: Vec2, point: (x: number, y: number) => Vec2) =>
    [peak, point(-0.1, 0.1), point(-0.32, 0.66), point(-0.19, 0.25), point(-0.26, -0.14)] as const,
  snow: (peak: Vec2, point: (x: number, y: number) => Vec2) =>
    [
      peak,
      point(-0.36, -0.43),
      point(-0.16, -0.51),
      point(0.05, -0.38),
      point(0.17, -0.5),
    ] as const,
  scree: (point: (x: number, y: number) => Vec2) =>
    [point(-0.64, 0.35), point(-0.32, 0.1), point(-0.42, 0.52), point(-0.76, 0.63)] as const,
  volcanicFissure: (peak: Vec2, point: (x: number, y: number) => Vec2) =>
    [peak, point(-0.12, -0.22), point(0.04, 0.12), point(-0.2, 0.4)] as const,
  footBounds: (x: number, y: number, ry: number, rx: number) =>
    [x, y + ry * 0.2, rx * 1.12, ry * 0.77] as const,
  hills: [
    [0, 245, 180, 48],
    [1, 1360, 180, 52],
    [2, 280, 730, 42],
    [3, 1340, 720, 48],
    [4, 530, 555, 26],
    [5, 1075, 560, 31],
  ] as const,
  border: {
    overhang: 40,
    northInset: 32,
    southInset: 12,
    southOffset: 11,
    southWidth: 0.9,
    eastInset: 5,
    eastOffset: 7,
    westInset: 8,
    horizontalSpacing: 1.15,
  },
  corner: { first: 38, bottom: 310, rowStep: 48, right: 235, taper: 0.35, columnStep: 55 },
  hill: { offsetRange: 21, offsetCentre: 10, aspect: 0.7 },
  peak: { x: -0.35, y: -0.85, variationStep: 0.08 },
  shoulder: { x: 0.38, y: -0.25, variationStep: 0.1 },
  massif: (point: (x: number, y: number) => Vec2, peak: Vec2, shoulder: Vec2) =>
    [
      point(-1, 0.55),
      point(-0.87, -0.08),
      point(-0.55, -0.4),
      peak,
      shoulder,
      point(0.81, -0.05),
      point(1, 0.55),
      point(0.35, 0.75),
      point(-0.45, 0.7),
    ] as const,
} as const;
