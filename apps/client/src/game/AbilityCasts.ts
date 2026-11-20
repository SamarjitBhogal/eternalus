import type { EntityId, Simulation } from '@eternalus/core';

import type { HudSlotId } from '../bridge/Binding.types';
import type { CastMode } from '../bridge/slices/settingsSlice';
import type { CastInput, CastSlots } from './AbilityCasts.types';

/**
 * Turns the ability slots the player presses into `cast-ability` commands (architecture 05 §7;
 * DEC-200, DEC-209 (3)). Two modes, chosen in the settings:
 *
 * - `quick`: a slot key queues the cast at once, aimed at the pointer.
 * - `aim-then-click`: a slot key only selects that slot (`aimingSlot`), for every ability; another
 *   slot key switches the selection; the next main-button press queues the cast aimed at the
 *   click; `cancel` drops the selection (Esc). The selection is reported through `onAimingChanged`
 *   the moment it changes, so the store knows it before the next frame.
 *
 * In both modes a slot whose ability does not use the aim (`AbilityDisplay.usesAim` false: Fury's
 * dash in the `granted` slot, Space) queues its cast at once and leaves the selection alone: it
 * aims itself (the dash goes the way the Legend moves, DEC-270, DEC-283; core ignores the aim).
 * The client checks the ability now in the slot, never the targeting kind. Such a cast needs no
 * pointer: it goes out aimed at the pointer's latest world point (`aimPoint`), else at the
 * Legend's own position, so the dash still fires while the pointer is off the canvas or over the
 * HUD, or has had no point yet. One path is bound to the slot: `granted` has no HUD slot to
 * select, so an ability there that does use the aim casts at the pointer even in aim-then-click.
 * Every other ability takes the paths above.
 *
 * `apply` returns whether the main button is consumed: while a slot is selected, and until the
 * confirming press is released, it is no basic attack.
 */
export class AbilityCasts {
  private castMode: CastMode = 'quick';

  private aiming: HudSlotId | null = null;

  /**
   * The latest world point under the pointer, for the range overlay and the cast of an ability
   * that does not use the aim; `null` before any.
   */
  private lastAim: CastInput['aim'] = null;

  /** Whether the main button was held on the previous tick, to find the press edge. */
  private wasAttacking = false;

  /** Whether the button that confirmed a cast is still down (it must not then attack). */
  private isConfirmHeld = false;

  /**
   * @param simulation Where the `cast-ability` commands go.
   * @param onAimingChanged Called with the new selection each time it changes.
   * @param slots The ability each slot holds now, and where the Legend stands.
   */
  public constructor(
    private readonly simulation: Pick<Simulation, 'enqueueCommand'>,
    private readonly onAimingChanged: (slot: HudSlotId | null) => void,
    private readonly slots: CastSlots,
  ) {}

  /** The slot selected for aiming, or `null`. */
  public get aimingSlot(): HudSlotId | null {
    return this.aiming;
  }

  /** The latest world point under the pointer (the range overlay's aim), or `null`. */
  public get aimPoint(): CastInput['aim'] {
    return this.lastAim;
  }

  /** Switches the mode; leaving aim-then-click drops the selection. */
  public setCastMode(mode: CastMode): void {
    this.castMode = mode;
    if (mode === 'quick') {
      this.cancel();
    }
  }

  /** Drops the selected slot, if any (Esc, a pause). */
  public cancel(): void {
    this.select(null);
  }

  /**
   * Reads this tick's input for the Legend `actorId`.
   *
   * @returns Whether the main button is consumed by aiming or by the cast it confirmed.
   */
  public apply(actorId: EntityId, input: CastInput): boolean {
    if (input.aim !== null) {
      this.lastAim = input.aim;
    }
    const isPress = input.isAttacking && !this.wasAttacking;
    this.wasAttacking = input.isAttacking;
    if (!input.isAttacking) {
      this.isConfirmHeld = false;
    }
    for (const slot of input.triggered) {
      if (!this.slots.usesAim(slot)) {
        // It aims itself (see the class doc): core ignores the point, so any point will do.
        this.queueCast(actorId, slot, this.lastAim ?? this.slots.legendAt());
      } else if (this.castMode === 'quick' || slot === 'granted') {
        // The `granted` slot has no HUD slot to select, so an aimed one casts at the pointer.
        this.queueCast(actorId, slot, input.aim);
      } else if (slot !== 'default-action') {
        this.select(slot);
      }
    }
    if (this.castMode === 'quick') {
      return false;
    }
    if (this.aiming !== null && isPress && input.aim !== null) {
      this.queueCast(actorId, this.aiming, input.aim);
      this.select(null);
      this.isConfirmHeld = true;
    }
    return this.aiming !== null || this.isConfirmHeld;
  }

  private select(slot: HudSlotId | null): void {
    if (slot !== this.aiming) {
      this.aiming = slot;
      this.onAimingChanged(slot);
    }
  }

  /** A cast with no pointer point has no aim: it queues nothing. */
  private queueCast(
    actorId: EntityId,
    slot: CastInput['triggered'][number],
    point: CastInput['aim'],
  ): void {
    if (point !== null) {
      this.simulation.enqueueCommand({
        type: 'cast-ability',
        actorId,
        slot,
        aim: { point, targetId: null },
      });
    }
  }
}
