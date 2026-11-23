import type { AbilityKit, AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import { ABILITY_SLOTS, ULTIMATE_SLOT } from './Abilities.constants';
import type { CastInProgress } from './Abilities.types';
import { AbilitySlotRuntime } from './AbilitySlotRuntime';

/**
 * A Legend's ability bar (architecture 05 §6): one `AbilitySlotRuntime` per slot, in bar order,
 * and the casts whose later steps still wait (05 §4), so they leave the match with the Legend. It
 * also holds the Legend's passive (05 §7), which is on no bar slot: it is due from the spawn until
 * `AbilitySystem` puts it on, and due again after a reset removed every status. Aether is its own
 * component (`Aether`, plan arch call 3).
 */
export class Abilities {
  private readonly bySlot: ReadonlyMap<AbilitySlot, AbilitySlotRuntime>;

  private readonly casts: CastInProgress[] = [];

  private isPassiveDueNow: boolean;

  /**
   * Builds the bar from `kit` (DEC-198, DEC-209 (2)): its three abilities on `ability-1` to
   * `ability-3`, its ultimate on `ability-4`; the gadget and default-action slots stay empty until
   * their content exists.
   *
   * @param passiveId - The Legend's passive (`passiveOf`: its spec's, else its class's; DEC-361),
   *   due at once; `null` for none.
   */
  public constructor(
    kit: AbilityKit,
    public readonly passiveId: string | null = null,
  ) {
    this.isPassiveDueNow = passiveId !== null;
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

  /** The casts whose later steps wait for their due tick (05 §4), oldest first. */
  public get castsInProgress(): readonly CastInProgress[] {
    return this.casts;
  }

  /** Keeps `cast`, whose later steps wait for their due tick, after the others. */
  public keepCast(cast: CastInProgress): void {
    this.casts.push(cast);
  }

  /** Whether the passive waits for `AbilitySystem` to put it on. */
  public get isPassiveDue(): boolean {
    return this.isPassiveDueNow;
  }

  /** Returns the passive's id and marks it put on when it is due; `null` otherwise. */
  public takeDuePassive(): string | null {
    if (!this.isPassiveDueNow) {
      return null;
    }
    this.isPassiveDueNow = false;
    return this.passiveId;
  }

  /** Makes the passive due again: a reset (a Duel round) removed every status, its own too. */
  public rearmPassive(): void {
    this.isPassiveDueNow = this.passiveId !== null;
  }

  /**
   * Ends every cast in progress and returns them, oldest first: `AbilitySystem` fires their due
   * steps and keeps again those with steps left; a reset (a Duel round) drops them.
   */
  public endCasts(): readonly CastInProgress[] {
    return this.casts.splice(0);
  }
}
