/** DEC-238 stand-in geometry, extracted unchanged from the approved biome drawing. */
// TUNE: Cosmetic sketch-space dimensions only; no navigation or damage tuning.
export const BIOME_GROUND_ART = {
  variation: { yShift: 8, heightShift: 5 },
  rim: [
    [-19, 0],
    [-6, -5],
    [18, -2],
  ],
  ice: {
    seam: [
      [-10, -5],
      [-2, -1],
      [5, -4],
      [13, 1],
    ],
    width: 0.9,
    drift: { x: 9, y: -6, rx: 17, ry: 4 },
  },
  fracture: {
    seam: [
      [-20, -5],
      [-4, 3],
      [3, -1],
      [17, 6],
    ],
    width: 2.3,
    shrub: { x: 4, y: -4 },
    ember: [
      [-9, 0],
      [-4, 3],
      [3, -1],
    ],
    emberWidth: 0.65,
    emberModulo: 3,
    ash: { x: -9, y: 6, rx: 5, ry: 2 },
  },
  shrub: {
    stem: [
      [-1, 5],
      [0, 0],
      [-2, -7],
    ],
    width: 1,
    twig: [
      [0, 1],
      [5, -3],
      [6, -6],
    ],
    twigWidth: 0.7,
  },
} as const;

/** Mountain biome ornaments, with unchanged DEC-238 presentation dimensions. */
// TUNE: Cosmetic only; the mountain mass remains the original terrain collider.
export const BIOME_MOUNTAIN_ART = { naturalSnowHeight: 45, fissureWidth: 1.1 } as const;
