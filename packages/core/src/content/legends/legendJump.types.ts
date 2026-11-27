/** A Legend's jump (DEC-390), as authored: the air time in seconds, the peak height in metres. */
export type AuthoredLegendJump = {
  /** Seconds from takeoff to landing. */
  readonly airSeconds: number;
  /** Metres above the ground at the top of the arc, halfway through the air time. */
  readonly peakHeight: number;
};

/** A Legend's jump as loaded: the air time in ticks (at least one), the peak height in metres. */
export type LegendJump = {
  /** Ticks from takeoff to landing. */
  readonly airTicks: number;
  /** Metres above the ground at the top of the arc. */
  readonly peakHeight: number;
};
