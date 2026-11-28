/**
 * The boss move waiting to land (architecture 11 §4.6), from its telegraph to its landing tick.
 * Game state, so `StateHasher` covers it. `BossMoveHandler` starts it; `BossMoveSystem` lands and
 * clears it.
 */
export class BossMoveCast {
  private moveIdValue: string | null = null;
  private landTickValue = 0;

  /** The move waiting to land, or `null`. */
  public get moveId(): string | null {
    return this.moveIdValue;
  }

  /** The tick the move lands on. */
  public get landTick(): number {
    return this.landTickValue;
  }

  /** The fields that change the entity's future, for `StateHasher`. */
  public get fields(): readonly (string | number | null)[] {
    return [this.moveIdValue, this.landTickValue];
  }

  /** Starts `moveId`, to land on `landTick`, replacing any move not yet landed. */
  public begin(moveId: string, landTick: number): void {
    this.moveIdValue = moveId;
    this.landTickValue = landTick;
  }

  /** The move landed (or was dropped): nothing waits. */
  public clear(): void {
    this.moveIdValue = null;
    this.landTickValue = 0;
  }
}
