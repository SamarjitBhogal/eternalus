/** A colour as its `r,g,b` channels and its full alpha, so the cue can fade it. */
export type CueColor = { readonly rgb: string; readonly alpha: number };

/**
 * How one boss phase cue looks (`BossPhaseCueView`). Sizes are diameters in boss radii, times are
 * ticks, speeds are radians a tick.
 */
export type BossPhaseCueLook = {
  /** Rings that grow from `startSize` to `endSize` and fade out over `ticks`, once per change. */
  readonly rings: {
    readonly ticks: number;
    readonly startSize: number;
    readonly endSize: number;
    /** When each ring starts, as a share of `ticks`; one ring per entry. */
    readonly delays: readonly number[];
    readonly color: CueColor;
  };
  /** A disc under the boss for the whole phase: it fades in, then pulses. */
  readonly glow: {
    readonly size: number;
    readonly color: CueColor;
    /** How far the alpha swings above and below `color.alpha`. */
    readonly pulseAlpha: number;
    readonly pulseSpeed: number;
    readonly fadeInTicks: number;
  };
  /** Light motes that orbit the boss all phase, evenly spaced, fading in with the glow. */
  readonly particles: {
    readonly count: number;
    readonly orbitSize: number;
    /** How far a mote moves in and out of its orbit, as a share of it. */
    readonly bobShare: number;
    readonly bobSpeed: number;
    readonly orbitSpeed: number;
    readonly size: number;
    readonly color: CueColor;
  };
};
