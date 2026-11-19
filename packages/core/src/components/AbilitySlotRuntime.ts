import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { Aim, LastCast } from './AbilitySlotRuntime.types';

/**
 * One ability bar slot's runtime state (architecture 05 §6, `AbilityRuntime`): which ability it
 * holds (fixed by the kit, except the `granted` slot, which a status fills and empties through
 * `hold`), when its cooldown ends, the ultimate's charge and the cast waiting for `AbilitySystem`.
 * `Abilities` owns one per slot. Lives in `components/` like `StatusEffectRuntime` (plan arch call
 * 3); the cast rules are `abilities/CastValidator`'s, not this class's.
 */
export class AbilitySlotRuntime {
  /** The tick the cooldown ends on; stamped at cast, never counted down (05 §7). */
  public cooldownUntilTick = 0;

  /** The ultimate meter, 0 to 1 (DEC-202); filled by the charge rules, emptied by a cast. */
  public charge = 0;

  private held: string | null;

  private pending: Aim | null = null;

  private last: LastCast | null = null;

  /**
   * @param slot - The bar slot.
   * @param builtWith - The ability it holds at first (a kit entry), or `null` for an empty slot.
   */
  public constructor(
    public readonly slot: AbilitySlot,
    public readonly builtWith: string | null,
  ) {
    this.held = builtWith;
  }

  /** The ability the slot holds, or `null` when it is empty. */
  public get abilityId(): string | null {
    return this.held;
  }

  /**
   * Puts `abilityId` in the `granted` slot, or empties it (`null`): a status fills it with the
   * ability it grants while it lasts (`StatusEffectApplier`). A loadout change is not this method's
   * job: architecture 05 §6 plans `reset` for it, which starts the full cooldown (not built yet,
   * 05 §18). Holding the ability already held changes nothing (a refreshed status keeps the
   * cooldown). Any other change also ends the cooldown: it belonged to the ability that left, and an
   * empty slot never cools down (`cooldown-and-aether-bounds`).
   */
  public hold(abilityId: string | null): void {
    if (abilityId !== this.held) {
      this.held = abilityId;
      this.cooldownUntilTick = 0;
    }
  }

  /** The accepted cast waiting for `AbilitySystem` this tick, or `null`. */
  public get pendingCast(): Aim | null {
    return this.pending;
  }

  /** The last cast as it began (for the invariants), or `null` before the first. */
  public get lastCast(): LastCast | null {
    return this.last;
  }

  /** Whether the cooldown still runs at `tick`. */
  public isCoolingDown(tick: number): boolean {
    return tick < this.cooldownUntilTick;
  }

  /** Ticks left on the cooldown at `tick`; 0 when ready. */
  public cooldownRemaining(tick: number): number {
    return Math.max(0, this.cooldownUntilTick - tick);
  }

  /** Records an accepted `cast-ability` aimed at `aim`; `AbilitySystem` takes it this tick. */
  public queue(aim: Aim): void {
    this.pending = aim;
  }

  /** Returns the pending cast and clears it. */
  public takePending(): Aim | null {
    const aim = this.pending;
    this.pending = null;
    return aim;
  }

  /**
   * Starts a cast at `tick`: the cooldown runs from now for `cooldownTicks` (cooldowns start at
   * cast, 05 §7) and the charge empties (an ultimate's meter; always 0 elsewhere). The ability
   * cast and the values before the cast are kept in `lastCast`.
   */
  public recordCast(tick: number, cooldownTicks: number): void {
    this.last = {
      tick,
      abilityId: this.held,
      cooldownUntilTickBefore: this.cooldownUntilTick,
      chargeBefore: this.charge,
    };
    this.cooldownUntilTick = tick + cooldownTicks;
    this.charge = 0;
  }
}
