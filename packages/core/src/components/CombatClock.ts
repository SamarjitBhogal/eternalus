/**
 * When an entity last fought (DEC-188, DEC-215): the last tick it dealt or took damage
 * (`activeTick`) and the last tick it took damage (`hurtTick`). `OutOfCombatHealingSystem` adds it
 * on the entity's first `damage-applied`, as attacker or target, and records each later one. A
 * unit is in combat until `activeTick` lies the heal delay back; a structure is under attack until
 * `hurtTick` lies the quiet time back. An entity without one has not fought since tick 0.
 */
export class CombatClock {
  private activeTickValue = 0;

  private hurtTickValue = 0;

  /** The last tick the entity dealt or took damage. */
  public get activeTick(): number {
    return this.activeTickValue;
  }

  /** The last tick the entity took damage. */
  public get hurtTick(): number {
    return this.hurtTickValue;
  }

  /** The fields that change the entity's future, for `StateHasher`. */
  public get fields(): readonly number[] {
    return [this.activeTickValue, this.hurtTickValue];
  }

  /** Records that the entity took damage on `tick`, which also counts as fighting. */
  public recordHurt(tick: number): void {
    this.activeTickValue = tick;
    this.hurtTickValue = tick;
  }

  /** Records that the entity dealt damage on `tick`. */
  public recordDealt(tick: number): void {
    this.activeTickValue = tick;
  }
}
