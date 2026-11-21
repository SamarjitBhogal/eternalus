import type { AttackMode, MeleeAttack, UnitAttack } from '../content/units/units.types';

/**
 * A unit's attack state (architecture 04 §3): what it attacks, its target and when it may hit
 * again. `CombatSystem` reads it every tick; the `attack-target` command sets the target and the
 * attack mode. Ids are plain strings because `components/` may not import `state/` (02 §2).
 * Both attacks share one cooldown (`readyAtTick`).
 */
export class Combat {
  /** The unit's melee attack, or `null` when it has none (`attack-target` mode `'melee'` fails). */
  public readonly melee: MeleeAttack | null;

  private targetIdValue: string | null = null;

  private modeValue: AttackMode = 'basic';

  private readyAtTickValue = 0;

  /**
   * @param basicAttack - The basic attack, with `interval` already in ticks.
   * @param weaponId - The equipped weapon the attack comes from (05 §10), or `null` for a unit's own
   *   attack (mobs).
   * @param melee - The melee attack, `null` for none. Omit it to use the basic attack when that is
   *   melee (mobs, talons).
   */
  public constructor(
    public readonly basicAttack: UnitAttack,
    public readonly weaponId: string | null = null,
    melee?: MeleeAttack | null,
  ) {
    this.melee = melee ?? (basicAttack.strategy === 'melee' ? basicAttack : null);
  }

  /** The attack in use: the melee attack in melee mode, else the basic attack. */
  public get attack(): UnitAttack {
    return this.modeValue === 'melee' && this.melee !== null ? this.melee : this.basicAttack;
  }

  /** Which attack the current target is attacked with. */
  public get mode(): AttackMode {
    return this.modeValue;
  }

  /** The entity being attacked, or `null` when idle. */
  public get targetId(): string | null {
    return this.targetIdValue;
  }

  /** The first tick the next hit may land. */
  public get readyAtTick(): number {
    return this.readyAtTickValue;
  }

  /** Starts attacking `targetId` with `mode`, or stops with `null` (which resets the mode). */
  public setTarget(targetId: string | null, mode: AttackMode = 'basic'): void {
    this.targetIdValue = targetId;
    this.modeValue = targetId === null ? 'basic' : mode;
  }

  /** Whether the attack is off cooldown at `tick`. */
  public canAttack(tick: number): boolean {
    return tick >= this.readyAtTickValue;
  }

  /**
   * Records a hit at `tick`, putting the attack on cooldown for the active attack's `interval` ticks
   * divided by `attackSpeed` (statuses: 0.7 concussed), at least one tick.
   */
  public beginAttack(tick: number, attackSpeed = 1): void {
    this.readyAtTickValue = tick + Math.max(1, Math.round(this.attack.interval / attackSpeed));
  }
}
