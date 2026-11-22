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

  private attackValue: UnitAttack;

  private attacks: UnitAttacks;

  private weaponIdValue: string | null;

  /**
   * @param attacks - The attacks by mode, with `interval` already in ticks (`attacksByMode`).
   * @param weaponId - The equipped weapon the attacks come from (05 §10), or `null` for a unit's own
   *   attack (mobs).
   */
  public constructor(attacks: UnitAttacks, weaponId: string | null = null) {
    this.attacks = attacks;
    this.weaponIdValue = weaponId;
    this.attackValue = attacks.basic;
  }

  /** The attack in use: the current mode's (`setTarget` takes only a mode the unit has). */
  public get attack(): UnitAttack {
    return this.attackValue;
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

  /**
   * Starts attacking `targetId` with `mode`, or stops with `null` (which resets the mode).
   *
   * @returns `false`, changing nothing, when the unit has no attack for `mode` (`attack-target`
   *   then answers `cannot-attack`).
   */
  public setTarget(targetId: string | null, mode: AttackMode = 'basic'): boolean {
    const nextMode = targetId === null ? 'basic' : mode;
    const attack = this.attacks[nextMode];
    if (attack === undefined) {
      return false;
    }
    this.targetIdValue = targetId;
    this.modeValue = nextMode;
    this.attackValue = attack;
    return true;
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

  /** The equipped weapon the attacks come from (05 §10), or `null` for a unit's own attack (mobs). */
  public get weaponId(): string | null {
    return this.weaponIdValue;
  }

  /**
   * Equips another weapon's attacks (DEC-303: the Zealot's weapon swap). The target and the attack
   * timer stay (owner card "PR9 swap timing", A). A mode the new attacks do not have becomes
   * `basic` (the bow has no `melee`: card "PR9 bow melee key", A).
   */
  public equip(attacks: UnitAttacks, weaponId: string): void {
    const attack = attacks[this.modeValue];
    this.attacks = attacks;
    this.weaponIdValue = weaponId;
    this.modeValue = attack === undefined ? 'basic' : this.modeValue;
    this.attackValue = attack ?? attacks.basic;
  }
}
