import type { AttackMode, UnitAttack, UnitAttacks } from '../content/units/units.types';

/**
 * A unit's attack state (architecture 04 §3): what it attacks, its target and when it may hit
 * again. `CombatSystem` reads it every tick; the `attack-target` command sets the target and the
 * attack mode. Ids are plain strings because `components/` may not import `state/` (02 §2).
 * The attacks share one cooldown (`readyAtTick`).
 */
export class Combat {
  private targetIdValue: string | null = null;

  private modeValue: AttackMode = 'basic';

  private readyAtTickValue = 0;

  /**
   * @param attacks - The attacks by mode, with `interval` already in ticks (`attacksByMode`).
   * @param weaponId - The equipped weapon the attacks come from (05 §10), or `null` for a unit's own
   *   attack (mobs).
   */
  public constructor(
    private readonly attacks: UnitAttacks,
    public readonly weaponId: string | null = null,
  ) {}

  /** The attack in use: the current mode's attack, else the basic attack. */
  public get attack(): UnitAttack {
    return this.attacks[this.modeValue] ?? this.attacks.basic;
  }

  /** Whether the unit has an attack for `mode` (`attack-target` refuses a mode it lacks). */
  public hasMode(mode: AttackMode): boolean {
    return this.attacks[mode] !== undefined;
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
