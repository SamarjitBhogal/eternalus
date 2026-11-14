import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { CastAim, LastCast } from './AbilitySlotRuntime.types';

/**
 * One ability bar slot's runtime state (architecture 05 §6, `AbilityRuntime`): which ability it
 * holds, when its cooldown ends, the ultimate's charge and the cast waiting for `AbilitySystem`.
 * `Abilities` owns one per slot. Lives in `components/` like `StatusEffectRuntime` (plan arch call
 * 3); the cast rules are `abilities/CastValidator`'s, not this class's.
 */
export class AbilitySlotRuntime {
  /** The tick the cooldown ends on; stamped at cast, never counted down (05 §7). */
  public cooldownUntilTick = 0;

  /** The ultimate meter, 0 to 1 (DEC-202); filled by the charge rules, emptied by a cast. */
  public charge = 0;

  private pending: CastAim | null = null;

  private last: LastCast | null = null;

  /**
   * @param slot - The bar slot.
   * @param abilityId - The ability it holds (a kit entry), or `null` for an empty slot.
   */
  public constructor(
    public readonly slot: AbilitySlot,
    public readonly abilityId: string | null,
  ) {}

  /** The accepted cast waiting for `AbilitySystem` this tick, or `null`. */
  public get pendingCast(): CastAim | null {
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
  public queue(aim: CastAim): void {
    this.pending = aim;
  }

  /** Returns the pending cast and clears it. */
  public takePending(): CastAim | null {
    const aim = this.pending;
    this.pending = null;
    return aim;
  }

  /**
   * Starts a cast at `tick`: the cooldown runs from now for `cooldownTicks` (cooldowns start at
   * cast, 05 §7) and the charge empties (an ultimate's meter; always 0 elsewhere). The values
   * before the cast are kept in `lastCast`.
   */
  public recordCast(tick: number, cooldownTicks: number): void {
    this.last = {
      tick,
      cooldownUntilTickBefore: this.cooldownUntilTick,
      chargeBefore: this.charge,
    };
    this.cooldownUntilTick = tick + cooldownTicks;
    this.charge = 0;
  }
}
