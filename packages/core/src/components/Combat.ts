import type { AttackMode, UnitAttack, UnitAttacks } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';
import type { CombatSwing } from './Combat.types';

/**
 * A unit's attack state (architecture 04 §3): what it attacks, its target (or the point it attacks
 * towards) and when it may hit again. `CombatSystem` reads it every tick; the `attack-target`
 * command sets the target and the attack mode, the `attack-aim` command sets an aim point and the
 * mode (DEC-184, DEC-319). A unit holds a target or an aim point, never both. Ids are plain
 * strings because `components/` may not import `state/` (02 §2).
 * The attacks share one cooldown (`readyAtTick`).
 */
export class Combat {
  private targetIdValue: string | null = null;

  private aimPointValue: Vec2 | null = null;

  private lastSwingValue: CombatSwing | null = null;

  private modeValue: AttackMode = 'basic';

  private readyAtTickValue = 0;

  private attackValue: UnitAttack;

  /**
   * @param attacks - The attacks by mode, with `interval` already in ticks (`attacksByMode`).
   * @param weaponId - The equipped weapon the attacks come from (05 §10), or `null` for a unit's own
   *   attack (mobs).
   */
  public constructor(
    private readonly attacks: UnitAttacks,
    public readonly weaponId: string | null = null,
  ) {
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

  /** The world point the unit attacks towards, or `null` when it holds no aimed attack. */
  public get aimPoint(): Vec2 | null {
    return this.aimPointValue;
  }

  /** The latest sweep this unit made, for the swing visual; display only, never hashed. */
  public get lastSwing(): CombatSwing | null {
    return this.lastSwingValue;
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
    this.aimPointValue = null;
    this.modeValue = nextMode;
    this.attackValue = attack;
    return true;
  }

  /**
   * Starts attacking towards `point` with `mode`, dropping any target (DEC-319). `null` stops an aimed
   * attack and resets the mode, and does nothing when there is none: a target set by
   * `attack-target` stays.
   *
   * @returns `false`, changing nothing, when the unit has no attack for `mode`.
   */
  public setAim(point: Vec2 | null, mode: AttackMode = 'basic'): boolean {
    if (point === null && this.aimPointValue === null) {
      return true;
    }
    const nextMode = point === null ? 'basic' : mode;
    const attack = this.attacks[nextMode];
    if (attack === undefined) {
      return false;
    }
    this.aimPointValue = point === null ? null : { x: point.x, y: point.y };
    if (point !== null) {
      this.targetIdValue = null;
    }
    this.modeValue = nextMode;
    this.attackValue = attack;
    return true;
  }

  /** Records the sweep just made at `swing.tick`, for the client to draw (DEC-304). Copies it. */
  public recordSwing(swing: CombatSwing): void {
    this.lastSwingValue = {
      tick: swing.tick,
      direction: { x: swing.direction.x, y: swing.direction.y },
      radius: swing.radius,
      arcDegrees: swing.arcDegrees,
    };
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
