/**
 * A minion's level and kills (game doc "Minion XP"): one level with two sources (DEC-168). Kills
 * earn a level every `killsPerLevel` (`gainLevels`); a held capture zone grants levels that its
 * loss takes back (`grantLevels`, 07 §7, DEC-258). The level is the sum of both, capped, so losing
 * a granted level never costs a level the kills earned. Added by `VeterancySystem` on a minion's
 * first kill or level; other systems reach it through `VeterancySystem`'s events, so the level's
 * effects apply.
 */
export class Veterancy {
  private killsValue = 0;

  private levelValue = 0;

  private earnedValue = 0;

  private grantedValue = 0;

  private grantedByValue: string | null = null;

  /** Mob kills so far. */
  public get kills(): number {
    return this.killsValue;
  }

  /** Levels earned by kills, past the cap too. */
  public get earned(): number {
    return this.earnedValue;
  }

  /** Levels granted by another source and not yet taken back, past the cap too. */
  public get granted(): number {
    return this.grantedValue;
  }

  /** The entity whose levels are granted (a capture point), or `null` while none are. */
  public get grantedBy(): string | null {
    return this.grantedByValue;
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

  /** Earns `levels` levels from kills without passing `maxLevel`; returns how many it gained. */
  public gainLevels(levels: number, maxLevel: number): number {
    this.earnedValue += Math.max(0, levels);
    return this.settle(maxLevel);
  }

  /**
   * Adds `levels` levels granted by `sourceId`, or takes some back when negative (never below none
   * granted); returns how much the level changed, which the cap may make less than `levels`.
   */
  public grantLevels(levels: number, maxLevel: number, sourceId: string): number {
    this.grantedValue = Math.max(0, this.grantedValue + levels);
    this.grantedByValue = this.grantedValue > 0 ? sourceId : null;
    return this.settle(maxLevel);
  }

  private settle(maxLevel: number): number {
    const next = Math.min(maxLevel, this.earnedValue + this.grantedValue);
    const change = next - this.levelValue;
    this.levelValue = next;
    return change;
  }
}
