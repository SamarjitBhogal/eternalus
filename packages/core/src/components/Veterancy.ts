/**
 * A lane minion's kills and the level they earned (game doc "Minion XP"). Added by
 * `VeterancySystem` on a minion's first kill.
 */
export class Veterancy {
  private killsValue = 0;

  private levelValue = 0;

  /** Mob kills so far. */
  public get kills(): number {
    return this.killsValue;
  }

  /** Levels earned, from 0 to the cap. */
  public get level(): number {
    return this.levelValue;
  }

  /**
   * Counts one kill; returns whether it earned a level (every `killsPerLevel` kills, up to
   * `maxLevel`).
   */
  public recordKill(killsPerLevel: number, maxLevel: number): boolean {
    this.killsValue += 1;
    const earned = Math.min(maxLevel, Math.floor(this.killsValue / killsPerLevel));
    const isLevelUp = earned > this.levelValue;
    this.levelValue = earned;
    return isLevelUp;
  }
}
