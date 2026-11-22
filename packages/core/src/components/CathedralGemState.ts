import type { Team } from '../teams/teams.types';

/**
 * The Cathedral gem's state (DEC-291, DEC-292): the team that holds the Cathedral, whose colour the
 * gem shows, and the glow a hit or a touch leaves on it. `CathedralGemSystem` is the only writer;
 * the snapshot carries it, so the view needs no other entity.
 */
export class CathedralGemState {
  private holderValue: Team = 'neutral';
  private glowTicksLeftValue = 0;
  private glowHitsValue = 0;
  private ticksSinceHitValue: number | null = null;

  /** Who holds the Cathedral; `'neutral'` at match start. */
  public get holder(): Team {
    return this.holderValue;
  }

  /** Ticks the glow still lasts; 0 when it is dark. */
  public get glowTicksLeft(): number {
    return this.glowTicksLeftValue;
  }

  /** Hits since the glow last went dark: more hits glow brighter and wider (DEC-292). */
  public get glowHits(): number {
    return this.glowHitsValue;
  }

  /** Ticks since the last hit (0 on the tick it was struck), or `null` before the first. */
  public get ticksSinceHit(): number | null {
    return this.ticksSinceHitValue;
  }

  /** The values `StateHasher` hashes, in a fixed order. */
  public get fields(): readonly (string | number | null)[] {
    return [this.holderValue, this.glowTicksLeftValue, this.glowHitsValue, this.ticksSinceHitValue];
  }

  /** The Cathedral changed hands. */
  public hold(team: Team): void {
    this.holderValue = team;
  }

  /** Struck: the glow restarts at `glowTicks`, counting one more hit while it is still lit. */
  public struck(glowTicks: number): void {
    this.glowHitsValue = this.glowTicksLeftValue > 0 ? this.glowHitsValue + 1 : 1;
    this.glowTicksLeftValue = glowTicks;
    this.ticksSinceHitValue = 0;
  }

  /** One tick passed: the glow fades by a tick, and goes dark (no hits counted) at 0. */
  public age(): void {
    if (this.ticksSinceHitValue !== null) this.ticksSinceHitValue += 1;
    if (this.glowTicksLeftValue === 0) return;
    this.glowTicksLeftValue -= 1;
    if (this.glowTicksLeftValue === 0) this.glowHitsValue = 0;
  }
}
