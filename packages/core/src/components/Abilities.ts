import type { AbilityKit, AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import { ABILITY_SLOTS, ULTIMATE_SLOT } from './Abilities.constants';
import { AbilitySlotRuntime } from './AbilitySlotRuntime';

/**
 * A Legend's ability bar (architecture 05 §6): one `AbilitySlotRuntime` per slot, in bar order.
 * Aether is its own component (`Aether`, plan arch call 3); this one holds the slots only.
 */
export class Abilities {
  private readonly bySlot: ReadonlyMap<AbilitySlot, AbilitySlotRuntime>;

  /**
   * Builds the bar from `kit` (DEC-198, DEC-209 (2)): its three abilities on `ability-1` to
   * `ability-3`, its ultimate on `ability-4`; the gadget and default-action slots stay empty until
   * their content exists.
   */
  public constructor(kit: AbilityKit) {
    const held = new Map<AbilitySlot, string>([
      ['ability-1', kit.abilities[0]],
      ['ability-2', kit.abilities[1]],
      ['ability-3', kit.abilities[2]],
      [ULTIMATE_SLOT, kit.ultimate],
    ]);
    this.bySlot = new Map(
      ABILITY_SLOTS.map((slot) => [slot, new AbilitySlotRuntime(slot, held.get(slot) ?? null)]),
    );
  }

  /** Every slot, in bar order. */
  public get slots(): readonly AbilitySlotRuntime[] {
    return [...this.bySlot.values()];
  }

  /** The runtime of `slot`; `undefined` for a name that is no bar slot (a command from outside the types). */
  public slot(slot: AbilitySlot): AbilitySlotRuntime | undefined {
    return this.bySlot.get(slot);
  }

  /** Whether a cast already waits for `AbilitySystem` on any slot (one cast per Legend per tick). */
  public get hasPendingCast(): boolean {
    return this.slots.some((runtime) => runtime.pendingCast !== null);
  }
}
