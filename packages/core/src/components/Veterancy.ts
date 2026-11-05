/**
 * A minion's level and kills (game doc "Minion XP"): one level with two sources (DEC-168). Kills
 * earn a level every `killsPerLevel`; another source (the zone level-up, balancing.md "+1 minion
 * level (max 3)") adds levels with `gainLevels`, and a later kill never takes them back. Added by
 * `VeterancySystem` on a minion's first kill or level.
 */
export class Veterancy {
  private killsValue = 0;

  private levelValue = 0;

  /** Mob kills so far. */
  public get kills(): number {
    return this.killsValue;
  }

  /** Levels gained from every source, from 0 to the cap. */
  public get level(): number {
    return this.levelValue;
  }

  /**
   * Counts one kill; every `killsPerLevel`-th kill (a whole number) gains a level, up to `maxLevel`.
   * Returns whether this kill gained one.
   */
  public recordKill(killsPerLevel: number, maxLevel: number): boolean {
    this.killsValue += 1;
    return this.killsValue % killsPerLevel === 0 && this.gainLevels(1, maxLevel) === 1;
  }

  /** Gains up to `levels` levels without passing `maxLevel`; returns how many it gained. */
  public gainLevels(levels: number, maxLevel: number): number {
    const gained = Math.max(0, Math.min(levels, maxLevel - this.levelValue));
    this.levelValue += gained;
    return gained;
  }
}
