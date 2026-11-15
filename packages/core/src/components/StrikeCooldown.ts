/**
 * When a structure that strikes back (the Cathedral gem, DISC-11) may strike again. Game state, so
 * `StateHasher` covers it: two matches with the same hash strike at the same tick.
 * `CathedralGemSystem` adds it on the gem's first strike; a gem without one has never struck.
 */
export class StrikeCooldown {
  private readyAtTickValue = 0;

  /** The first tick the structure may strike again. */
  public get readyAtTick(): number {
    return this.readyAtTickValue;
  }

  /** The fields that change the entity's future, for `StateHasher`. */
  public get fields(): readonly number[] {
    return [this.readyAtTickValue];
  }

  /** Whether the structure may strike on `tick`. */
  public isReady(tick: number): boolean {
    return tick >= this.readyAtTickValue;
  }

  /** Records a strike on `tick`: the next one may come `cooldownTicks` later. */
  public recordStrike(tick: number, cooldownTicks: number): void {
    this.readyAtTickValue = tick + cooldownTicks;
  }
}
