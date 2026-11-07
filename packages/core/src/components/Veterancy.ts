/**
 * A minion's level and kills (game doc "Minion XP"): one level with two sources (DEC-168). Kills
 * earn a level every `killsPerLevel`; that level and any other source's (the zone level-up,
 * balancing.md "+1 minion level (max 3)") are added with `gainLevels`, and a later kill never takes
 * them back. Added by `VeterancySystem` on a minion's first kill or level. Other level sources go
 * through `VeterancySystem` (a typed event later), not this component, so the level's effects
 * apply.
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
   * Counts one kill and returns whether it earns a level: every `killsPerLevel`-th kill (a whole
   * number) does. The level itself comes from `gainLevels`, which keeps the cap.
   */
  public recordKill(killsPerLevel: number): boolean {
    this.killsValue += 1;
    return this.killsValue % killsPerLevel === 0;
  }

  /** Gains up to `levels` levels without passing `maxLevel`; returns how many it gained. */
  public gainLevels(levels: number, maxLevel: number): number {
    const gained = Math.max(0, Math.min(levels, maxLevel - this.levelValue));
    this.levelValue += gained;
    return gained;
  }
}
