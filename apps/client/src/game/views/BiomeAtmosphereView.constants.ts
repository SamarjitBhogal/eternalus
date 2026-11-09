/** Bounded cosmetic particle budget; weather never creates simulation entities. */
export const WEATHER_PARTICLES = 56;
export const WEATHER_EDGE_FADE = 0.22;
export const WEATHER_PALETTES = {
  snow: { particle: [239, 248, 250], haze: [178, 205, 213] },
  lava: { particle: [178, 169, 151], haze: [202, 135, 75] },
} as const;
