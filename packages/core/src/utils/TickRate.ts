/** Converts authored times to simulation ticks at one tick rate; the one formula every content loader uses. */
export class TickRate {
  /** @param ticksPerSecond - `GameConfig.tickRate`. */
  public constructor(private readonly ticksPerSecond: number) {}

  /** `seconds` in ticks, rounded, never below one tick. */
  public toTicks(seconds: number): number {
    return Math.max(1, Math.round(seconds * this.ticksPerSecond));
  }
}
