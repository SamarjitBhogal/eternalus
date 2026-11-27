/** Authored stand-in silhouette coordinates and bounds (DEC-238). */
export const MINION_HEAD_GEOMETRY = {
  helmetOutline: [
    [-0.38, -1.35],
    [0, -1.61],
    [0.38, -1.35],
    [0.33, -0.82],
    [0, -0.69],
    [-0.33, -0.82],
  ] as const,
  helmetPlate: [
    [-0.28, -1.29],
    [0, -1.48],
    [0.28, -1.29],
    [0.25, -0.88],
    [0, -0.79],
    [-0.25, -0.88],
  ] as const,
  browCrest: [
    [0, -1.47],
    [0.27, -1.27],
    [0.23, -1.13],
    [0, -1.23],
    [-0.26, -1.14],
    [-0.26, -1.28],
  ] as const,
  horn: (side: number) =>
    [
      [side * 0.23, -1.34],
      [side * 0.59, -1.6],
      [side * 0.46, -1.16],
    ] as const,
  ear: (side: number) =>
    [
      [side * 0.29, -1.13],
      [side * 0.62, -1.05],
      [side * 0.31, -0.88],
    ] as const,
  face: [
    [-0.2, -0.98],
    [0.2, -0.98],
    [0.16, -0.81],
    [0, -0.74],
    [-0.16, -0.81],
  ] as const,
  helmetPlume: [
    [-0.09, -1.48],
    [0.02, -1.86],
    [0.22, -1.68],
    [0.1, -1.42],
  ] as const,
  eyeSlitBounds: [-0.25, -1.12, 0.5, 0.12] as const,
  eyeBounds: (side: number) => [side * 0.13 - 0.065, -1.095, 0.13, 0.045] as const,
  faceMouthBounds: [-0.15, -0.88, 0.3, 0.045] as const,
  helmetStripeBounds: [-0.035, -1.45, 0.07, 0.6] as const,
} as const;
