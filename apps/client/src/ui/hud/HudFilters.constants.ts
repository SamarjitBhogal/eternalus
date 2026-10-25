/** Id of the level number's filter (65:656); `LevelBadge.module.css` names it in `url(#…)`. */
export const HUD_FILTER_LEVEL_NUMBER = 'hud-filter-level-number';

/**
 * The level number's effects (Figma 65:656), with the two tuning values a Chrome render needs to
 * look like the Figma render (measured against hud.figma.png; the grain itself stays CD-25):
 * - shadows: Figma DROP_SHADOW blur 10 and 15 (SVG σ 5 and 7.5) render as σ 3.5 and 5.25, i.e.
 *   0.7 × the nominal σ (the ring 4–25 px around the digits fits best there);
 * - grain: Figma's NOISE is fractalNoise at base frequency 1, which Chrome samples on the noise
 *   lattice (a flat field, no grain at all), so 0.99; Figma's 13 of 100 luminance bins kept.
 */
export const LEVEL_NUMBER_EFFECTS = {
  /** The 72 × 63 text box the filter's object bounding box is (σ in its fractions scales with it). */
  box: { width: 72, height: 63 },
  nearSigma: 3.5,
  farSigma: 5.25,
  noise: { baseFrequency: 0.99, octaves: 3, seed: 8432 },
  grainBins: { total: 100, first: 18, count: 13 },
} as const;
