import type { AttackMode, UnitAttack, UnitAttacks } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';
import type { CombatSwing } from './Combat.types';

/**
 * A unit's attack state (architecture 04 §3): what it attacks, its target (or the point it attacks
 * towards) and when it may hit again. `CombatSystem` reads it every tick; the `attack-target`
 * command sets the target and the attack mode, the `attack-aim` command sets an aim point and the
 * mode (DEC-184, DEC-319). A unit holds a target or an aim point, never both. Ids are plain
 * strings because `components/` may not import `state/` (02 §2).
 * The attacks share one cooldown (`readyAtTick`). It also keeps the bodies its last attack hit
 * (`recordHits`), so the AI sees every body a unit attacks, not only its target (DEC-322 (2)).
 */
export class Combat {
  /** What `hitsAt` gives once the last attack's hits no longer count. */
  private static readonly NO_HITS: readonly string[] = [];

  private targetIdValue: string | null = null;

  private aimPointValue: Vec2 | null = null;

  private lastSwingValue: CombatSwing | null = null;

  private hitIdsValue: string[] = [];

  private hitAtTickValue = -1;

  private hitsUntilTickValue = 0;

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
   * Starts attacking `targetId` with `mode`, or stops with `null` (which resets the mode). Either
   * way it drops the aim point: a unit holds a target or an aim point, never both.
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
      atTick: swing.atTick,
      direction: { x: swing.direction.x, y: swing.direction.y },
      radius: swing.radius,
      arcDegrees: swing.arcDegrees,
    };
  }

  /**
   * The bodies the last attack hit, kept until `hitsUntilTick`; read them through `hitsAt`. Empty
   * before the first hit.
   */
  public get hitIds(): readonly string[] {
    return this.hitIdsValue;
  }

  /** The last tick at which the last attack's hits still count (`hitsAt`). */
  public get hitsUntilTick(): number {
    return this.hitsUntilTickValue;
  }

  /**
   * The bodies the last attack hit while they still count at `tick` (DEC-322 (2), DEC-333 (1)):
   * for one attack interval, or the slowed cooldown when that is longer, so at least through the
   * tick the next attack may land. So the AI, which decides before attacks land in a tick, sees a
   * held attack on every tick. Empty after that.
   */
  public hitsAt(tick: number): readonly string[] {
    return tick <= this.hitsUntilTickValue ? this.hitIdsValue : Combat.NO_HITS;
  }

  /**
   * Records that an attack touched `ids` at `tick` (a sweep's bodies, a shot's body, an ability's
   * targets). They count for one attack interval from `tick`, or for the cooldown `beginAttack`
   * starts at `attackSpeed` when a slow makes that longer (DEC-333 (1)): a fast attack's hits still
   * count for a whole interval, so a brain that decides less often than it swings sees them. Hits
   * of an earlier tick are replaced: only the last attack's are kept. Hits of the same tick are
   * added, so a shot and a sweep that land together both count. Copies `ids`.
   */
  public recordHits(ids: readonly string[], tick: number, attackSpeed: number): void {
    if (tick !== this.hitAtTickValue) {
      this.hitIdsValue = [];
      this.hitAtTickValue = tick;
      this.hitsUntilTickValue = 0;
    }
    for (const id of ids) {
      if (!this.hitIdsValue.includes(id)) this.hitIdsValue.push(id);
    }
    this.hitsUntilTickValue = Math.max(
      this.hitsUntilTickValue,
      tick + Math.max(this.attack.interval, this.cooldownTicks(attackSpeed)),
    );
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
    this.readyAtTickValue = tick + this.cooldownTicks(attackSpeed);
  }

  /** The active attack's cooldown in ticks: its `interval` divided by `attackSpeed`, at least 1. */
  private cooldownTicks(attackSpeed: number): number {
    return Math.max(1, Math.round(this.attack.interval / attackSpeed));
  }

  /** The equipped weapon the attacks come from (05 §10), or `null` for a unit's own attack (mobs). */
  public get weaponId(): string | null {
    return this.weaponIdValue;
  }

  /**
   * Equips other attacks: a Legend's weapon swap (DEC-303) or a turret's ammo switch. The target
   * or the aim point, the attack timer, the last swing and the recorded hits stay. A mode the new
   * attacks do not have becomes `basic`, and an aim point held with that mode stops: the held
   * button has no attack now, and `setAim` refuses that mode (`INBOX.md` HC-Q82, option A). A
   * target stays and gets the basic attack.
   *
   * @param attacks - The new attacks by mode, with `interval` already in ticks (`attacksByMode`).
   * @param weaponId - The weapon the new attacks come from, or `null` for a unit's own attack.
   */
  public equip(attacks: UnitAttacks, weaponId: string | null): void {
    const attack = attacks[this.modeValue];
    this.attacks = attacks;
    this.weaponIdValue = weaponId;
    if (attack === undefined) {
      this.modeValue = 'basic';
      this.aimPointValue = null;
    }
    this.attackValue = attack ?? attacks.basic;
  }
}
