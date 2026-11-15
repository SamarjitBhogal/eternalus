/**
 * Converts authored times to ticks and authored rates per second to per tick, at one tick rate; the
 * formulas every content loader uses.
 */
export class TickRate {
  /** @param ticksPerSecond - `GameConfig.tickRate`. */
  public constructor(private readonly ticksPerSecond: number) {}

  /** `seconds` in ticks, rounded, never below one tick. */
  public toTicks(seconds: number): number {
    return Math.max(1, this.roundToTicks(seconds));
  }

  /**
   * `seconds` in ticks, rounded, with no one-tick floor: for times where 0 means at once or never
   * (a guard's leash grace), and for times a loader rejects when they round below one tick.
   */
  public roundToTicks(seconds: number): number {
    return Math.round(seconds * this.ticksPerSecond);
  }

  /** A rate per second (a fraction of max health per second, say) as a rate per tick. */
  public perTick(perSecond: number): number {
    return perSecond / this.ticksPerSecond;
  }
}
