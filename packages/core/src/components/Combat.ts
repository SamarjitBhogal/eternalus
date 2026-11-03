import type { UnitAttack } from '../content/units/units.types';

/**
 * A unit's attack state (architecture 04 §3): what it attacks, its target and when it may hit
 * again. `CombatSystem` reads it every tick; the `attack-target` command sets the target.
 * Ids are plain strings because `components/` may not import `state/` (02 §2).
 */
export class Combat {
  private targetIdValue: string | null = null;

  private readyAtTickValue = 0;

  /**
   * @param attack - The basic attack, with `interval` already in ticks.
   * @param weaponId - The equipped weapon the attack comes from (05 §10), or `null` for a unit's own
   *   attack (mobs).
   */
  public constructor(
    public readonly attack: UnitAttack,
    public readonly weaponId: string | null = null,
  ) {}

  /** The entity being attacked, or `null` when idle. */
  public get targetId(): string | null {
    return this.targetIdValue;
  }

  /** The first tick the next hit may land. */
  public get readyAtTick(): number {
    return this.readyAtTickValue;
  }

  /** Starts attacking `targetId`, or stops with `null`. */
  public setTarget(targetId: string | null): void {
    this.targetIdValue = targetId;
  }

  /** Whether the attack is off cooldown at `tick`. */
  public canAttack(tick: number): boolean {
    return tick >= this.readyAtTickValue;
  }

  /**
   * Records a hit at `tick`, putting the attack on cooldown for `attack.interval` ticks divided by
   * `attackSpeed` (statuses: 0.7 concussed), at least one tick.
   */
  public beginAttack(tick: number, attackSpeed = 1): void {
    this.readyAtTickValue = tick + Math.max(1, Math.round(this.attack.interval / attackSpeed));
  }
}
