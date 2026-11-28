/**
 * How the Cathedral gem's eruption looks (Aryan 2026-11-22): a white flash, then two rings that
 * grow out from the gem, purple like its glow (`CathedralGemView.constants.ts`). Sizes are world
 * diameters; colours carry their alpha as `#rrggbbaa`. TUNE: defaults taken in the build.
 */
export const ERUPTION_LOOK = {
  /** The flash: a disc that shrinks away over the first `share` of the burst. */
  flash: { size: 30, color: '#ffffffd0', share: 0.35 },
  /** The rings: each grows from 0 to `size`, the second `delay` of the burst behind the first. */
  rings: [
    { size: 60, delay: 0, color: '#c084fc' },
    { size: 45, delay: 0.2, color: '#f5d0fe' },
  ],
  /** The minimap's ring: CSS pixels at the eruption, doubling by the burst's end (DEC-371 E1). */
  minimap: { size: 10, color: '#c084fc' },
} as const;
