/** Bounded cosmetic particle budget; weather never creates simulation entities. */
export const WEATHER_PARTICLES = 56;
export const WEATHER_EDGE_FADE = 0.22;
export const WEATHER_PALETTES = {
  snow: {
    direction: 1,
    radius: 0.0013,
    emberEvery: 0,
    particle: [239, 248, 250],
    haze: [178, 205, 213],
  },
  lava: {
    direction: -1,
    radius: 0.0009,
    emberEvery: 7,
    particle: [178, 169, 151],
    haze: [202, 135, 75],
  },
} as const;

/** DEC-238 cosmetic weather timing, opacity and shape tuning. */
export const WEATHER_MOTION = {
  seed: 0.61803398875,
  horizontalSeed: 0.381966,
  speed: 0.045,
  speedSteps: 5,
  speedStep: 0.008,
  swaySpeed: 0.4,
  sway: 0.025,
  wind: 0.012,
  size: 0.6,
  sizeSteps: 3,
  sizeStep: 0.3,
  alpha: 0.25,
  alphaSteps: 4,
  alphaStep: 0.12,
  emberAlpha: 0.65,
  emberRgb: '255,171,78',
  glowRgb: '255,215,111',
  glowAlpha: 0.06,
  glowSpeed: 1.4,
  glowPulse: 0.035,
  hazeBands: 5,
  hazeTop: 0.18,
  hazeStep: 0.15,
  hazeSpeed: 0.3,
  hazeSway: 0.025,
  hazeWidth: 0.3,
  hazeTip: 0.35,
  hazeHeight: 0.04,
  hazeTail: 0.02,
  hazeAlpha: 0.035,
} as const;
