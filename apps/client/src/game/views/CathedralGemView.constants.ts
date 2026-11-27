import type { Team } from '@eternalus/core';

/**
 * The gem's colour by the team holding the Cathedral (DEC-291: "the blue gems are for the light
 * team. A blood-red-purple version is for the dark team. the capture point, neutrals, etc are
 * purple-violet"). TUNE: DEC-291 gives no hex values; these are defaults taken in the build.
 */
export const GEM_COLORS: Readonly<Record<Team, string>> = {
  light: '#4f9fe0',
  dark: '#8c1c4a',
  neutral: '#8a5cd0',
};

/** The diamond's height over its width (DEC-291 keeps the gem 10 × 16). */
export const GEM_HEIGHT_PER_WIDTH = 1.6;

/** Crystal facets and ambient effects by Cathedral holder. */
export const GEM_FACETS: Readonly<Record<Team, { bright: string; shadow: string; aura: string }>> =
  {
    light: { bright: '#adebff', shadow: '#1b4b9f', aura: '#63c7ff34' },
    dark: { bright: '#ff9eac', shadow: '#4b164f', aura: '#ff538e34' },
    neutral: { bright: '#e3c7ff', shadow: '#4a258d', aura: '#b47cff38' },
  };

/** Presentation cycles in simulation ticks. */
export const GEM_IDLE = {
  orbitTicks: 150,
  shimmerTicks: 96,
  orbiters: 4,
  core: '#fff2ff',
} as const;

/**
 * The purple glow and pulse when the gem is hit (DEC-292: "a purple pulse aura when hit and glows
 * purple for the stun duration + 5 ticks. multiple hits make it glow brighter and the aura of the
 * glow grows"). Sizes are diameters in gem radii; colours carry their alpha as `#rrggbbaa`.
 * TUNE: DEC-292 gives no look beyond that; these are defaults taken in the build.
 */
export const GEM_GLOW = {
  /** The glow disc's diameter on the first hit, and how much each more hit adds, one per colour. */
  size: 3,
  sizePerHit: 0.75,
  /** The glow's colour, faintest first: one entry per hit counted, the last for every hit after. */
  colors: ['#a855f740', '#a855f760', '#a855f780', '#a855f7a0'],
  /** The pulse ring grows from `pulseStartSize` (the gem's own size) to `pulseSize` over `pulseTicks` after a hit. */
  pulseStartSize: 2,
  pulseSize: 6,
  pulseTicks: 10,
  pulseColor: '#c084fc',
} as const;
