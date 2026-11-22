/**
 * The mid-game cut-scene's timing and feel (Aryan 2026-11-22: the camera turns to the Cathedral,
 * the gem erupts, the Greater Boss appears). TUNE: no reference values; defaults taken in the build.
 */
export const CUTSCENE = {
  /** How long before the eruption the camera starts turning to the Cathedral. */
  panSeconds: 1.5,
  /** How long the camera stays on the Cathedral after the eruption, before it returns. */
  holdSeconds: 2.5,
  /** How long the burst lasts on the screen, from the eruption. */
  burstSeconds: 1.5,
  /** Share of the distance to the Cathedral the camera covers each frame (slower than follow). */
  smoothing: 0.08,
  /** The screen shake: its largest offset (world units) at the eruption, fading over the burst. */
  shake: { amplitude: 0.8, ticksPerSwing: 2 },
} as const;

/** The timeline entry the gem erupts on (core's default timeline, architecture 12 §3). */
export const ERUPTION_ENTRY = 'gem-eruption';
