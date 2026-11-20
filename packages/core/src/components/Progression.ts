import type { LevelCurveDefinition } from '../content/progression/progression.types';
import type { LevelProgress } from './Progression.types';

/**
 * A Legend's XP and level (architecture 04 §3, 05 §13). `xp` is the total earned this match; the
 * level follows it along the curve named by `curveId` and never goes down or past the cap. It keeps
 * the curve's id, not the curve (01 rule F); whoever adds XP passes the curve in.
 */
export class Progression {
  private xpValue = 0;

  private levelValue = 1;

  /** @param curveId - The id of the XP table this Legend levels along. */
  public constructor(public readonly curveId: string) {}

  /** Total XP earned, never negative. */
  public get xp(): number {
    return this.xpValue;
  }

  /** The current level, from 1 to the curve's cap. */
  public get level(): number {
    return this.levelValue;
  }

  /**
   * Adds `amount` XP (finite, ≥ 0) and returns how many levels it gained along `curve`.
   *
   * @throws Error when `amount` is negative or not finite.
   */
  public addXp(amount: number, curve: LevelCurveDefinition): number {
    if (!(amount >= 0) || !Number.isFinite(amount)) {
      throw new Error(`Progression XP must be a finite number ≥ 0, got ${String(amount)}.`);
    }
    this.xpValue += amount;
    const before = this.levelValue;
    while (
      this.levelValue < curve.cap &&
      this.xpValue >= Progression.xpForLevel(curve, this.levelValue + 1)
    ) {
      this.levelValue += 1;
    }
    return this.levelValue - before;
  }

  /**
   * Where this entity stands inside its level on `curve` (05 §15, the HUD's XP ring): the XP earned
   * since the level began, and the XP that level needs to reach the next one, `null` at the cap.
   */
  public levelProgress(curve: LevelCurveDefinition): LevelProgress {
    return {
      xp: this.xpValue - Progression.xpForLevel(curve, this.levelValue),
      xpToNext: this.levelValue >= curve.cap ? null : (curve.xpToNext[this.levelValue - 1] ?? null),
    };
  }

  /**
   * The XP that would bring this entity to the start of `level` on `curve` (the cap at most), or 0
   * when it is already there.
   */
  public xpToReach(level: number, curve: LevelCurveDefinition): number {
    return Math.max(0, Progression.xpForLevel(curve, Math.min(level, curve.cap)) - this.xpValue);
  }

  /** Total XP needed to reach `level` on `curve`. */
  private static xpForLevel(curve: LevelCurveDefinition, level: number): number {
    return curve.xpToNext.slice(0, level - 1).reduce((sum, step) => sum + step, 0);
  }
}
