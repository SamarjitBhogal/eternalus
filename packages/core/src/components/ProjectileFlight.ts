/**
 * Where a projectile is in its flight (DEC-306): flying, or ended. It holds the loaded definition's
 * `range` and `slowFrom`, how many ticks an ended shot stays, and that countdown. A shot ends at
 * its range; a hit or a wall removes it at once and never reaches this state.
 */
export class ProjectileFlight {
  private ticksLeft: number | null = null;

  /**
   * @param range - Metres from the origin where the shot stops (`ProjectileDefinition.range`).
   * @param slowFrom - Metres from the origin where it starts to slow; at most `range`.
   * @param endTicks - Ticks an ended shot stays before it is removed (loaded `endDuration`).
   */
  public constructor(
    public readonly range: number,
    public readonly slowFrom: number,
    private readonly endTicks: number,
  ) {}

  /** Whether the shot has ended and is only waiting to be removed. */
  public get isEnded(): boolean {
    return this.ticksLeft !== null;
  }

  /** Ticks left of the ending; `null` while the shot flies. */
  public get endTicksLeft(): number | null {
    return this.ticksLeft;
  }

  /** How far through its ending the shot is: 0 as it ends, 1 when it is removed; 0 while it flies. */
  public get endingShare(): number {
    return this.ticksLeft === null ? 0 : 1 - this.ticksLeft / this.endTicks;
  }

  /** Starts the ending. A shot that has ended stays as it is. */
  public end(): void {
    this.ticksLeft ??= this.endTicks;
  }

  /**
   * One tick of the ending.
   *
   * @returns Whether the ending is over: the shot is to be removed. `false` while it flies.
   */
  public tickEnding(): boolean {
    if (this.ticksLeft === null) return false;
    this.ticksLeft -= 1;
    return this.ticksLeft <= 0;
  }
}
