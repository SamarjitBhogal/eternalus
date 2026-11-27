/**
 * The mid-game cut-scene's timing and feel (Aryan 2026-11-22: the camera turns to the Cathedral,
 * the gem erupts, the Greater Boss appears). TUNE: no reference values; defaults taken in the
 * build.
 */
export const CUTSCENE = {
  /** How long before the eruption the camera starts turning to the Cathedral. */
  panSeconds: 1.5,
  /** How long the camera stays on the Cathedral after the eruption, before it returns. */
  holdSeconds: 2.5,
  /**
   * How close (world units, Legend to gem) a player must be for the cut-scene to play (DEC-371
   * E1: "only to players near the Cathedral"). DEC-415: the owner keeps 50 m, twice the
   * Cathedral's 25 m centre zone. TUNE: after play-testing.
   */
  nearRadius: 50,
  /** How long the burst lasts on the screen and the minimap, from the eruption. */
  burstSeconds: 1.5,
  /** Share of the distance to the Cathedral the camera covers each frame (slower than follow). */
  smoothing: 0.08,
  /**
   * The screen shake: its largest offset (world units) at the eruption, fading over the burst;
   * `verticalShare` is the share of the sideways swing the camera also moves up and down.
   */
  shake: { amplitude: 0.8, ticksPerSwing: 2, verticalShare: 0.5 },
} as const;
