import type {
  LevelCurveDefinition,
  LevelScalingDefinition,
} from '../content/progression/progression.types';

/**
 * A Legend's XP and level (architecture 04 §3, 05 §13). `xp` is the total earned this match; the
 * level follows it along the curve and never goes down or past the cap.
 */
export class Progression {
  private xpValue = 0;

  private levelValue = 1;

  /**
   * @param curve - The XP table to level along.
   * @param scaling - What each level adds; `ProgressionSystem` applies it.
   */
  public constructor(
    public readonly curve: LevelCurveDefinition,
    public readonly scaling: LevelScalingDefinition,
  ) {}

  /** Total XP earned, never negative. */
  public get xp(): number {
    return this.xpValue;
  }

  /** The current level, from 1 to `curve.cap`. */
  public get level(): number {
    return this.levelValue;
  }

  /**
   * Adds `amount` XP (finite, ≥ 0) and returns how many levels it gained.
   *
   * @throws Error when `amount` is negative or not finite.
   */
  public addXp(amount: number): number {
    if (!(amount >= 0) || !Number.isFinite(amount)) {
      throw new Error(`Progression XP must be a finite number ≥ 0, got ${String(amount)}.`);
    }
    this.xpValue += amount;
    const before = this.levelValue;
    while (
      this.levelValue < this.curve.cap &&
      this.xpValue >= this.xpForLevel(this.levelValue + 1)
    ) {
      this.levelValue += 1;
    }
    return this.levelValue - before;
  }

  /** Total XP needed to reach `level`. */
  private xpForLevel(level: number): number {
    return this.curve.xpToNext.slice(0, level - 1).reduce((sum, step) => sum + step, 0);
  }
}
