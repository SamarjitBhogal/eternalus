/**
 * Where a projectile is in its flight (DEC-306): flying, or ended. It holds the loaded definition's
 * `range` and `slowFrom`, how many ticks an ended shot stays, and that countdown. A straight shot
 * ends at its range; a hit or a wall removes it at once and never reaches this state. An arc shot
 * (`isArc`, DEC-342) flies over everything to its range, which is its aim point (`shortenTo`),
 * lands there, then ends.
 */
export class ProjectileFlight {
  private ticksLeft: number | null = null;
  private currentRange: number;
  private currentSlowFrom: number;

  /**
   * @param range - Metres from the origin where the shot stops (`ProjectileDefinition.range`).
   * @param slowFrom - Metres from the origin where it starts to slow; at most `range`.
   * @param endTicks - Ticks an ended shot stays before it is removed (loaded `endDuration`).
   * @param isArc - Whether it is an arc shot (`ProjectileDefinition.isArc`).
   */
  public constructor(
    range: number,
    slowFrom: number,
    private readonly endTicks: number,
    public readonly isArc = false,
  ) {
    this.currentRange = range;
    this.currentSlowFrom = slowFrom;
  }

  /** Metres from the origin where the shot stops: the definition's, or less once `shortenTo` ran. */
  public get range(): number {
    return this.currentRange;
  }

  /** Metres from the origin where it starts to slow; at most `range`. */
  public get slowFrom(): number {
    return this.currentSlowFrom;
  }

  /**
   * Shortens this shot's range to `range` metres (an arc shot flies to its aim point), keeping
   * `slowFrom` at most the new range. A range that is not shorter changes nothing.
   */
  public shortenTo(range: number): void {
    this.currentRange = Math.min(this.currentRange, Math.max(0, range));
    this.currentSlowFrom = Math.min(this.currentSlowFrom, this.currentRange);
  }

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
