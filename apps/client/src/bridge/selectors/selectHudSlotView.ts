import { createSelector } from '@reduxjs/toolkit';

import type { HudSlotId } from '../Binding.types';
import type { AssetId } from '../catalogue.types';
import type { AbilitySlotStatus, HudBlockReason } from '../hud.types';
import { hudSlice } from '../slices/hudSlice';
import type { RootState } from '../store';
import { selectHudKit } from './selectHudKit';

/**
 * How a slot looks (OD-9, owner 2026-10-18): `ready` is the gold-glow look (62:247, 65:711);
 * `cooldown` the red vertical gradient (62:264, 62:281), filled from the bottom by the remaining
 * cooldown; `idle` a slot that is neither (blocked, e.g. not enough aether); `no-data` a slot with
 * no runtime entry yet (DEC-17).
 */
export type HudSlotLook = 'ready' | 'cooldown' | 'idle' | 'no-data';

/** One HUD slot: the kit's name and icon joined with the slot's runtime state. */
export type HudSlotView = {
  /** From the class kit; `null` until abilities exist (the action label names the slot). */
  readonly displayName: string | null;
  readonly iconAssetId: AssetId | null;
  readonly look: HudSlotLook;
  /**
   * `cooldownRemainingTicks / cooldownTicks` in 0..1 (1 at the start of a cooldown), the height of
   * the red fill; `null` unless the look is `cooldown`.
   */
  readonly cooldownFraction: number | null;
  readonly blockedBy: HudBlockReason | null;
};

const { selectSlotStatus } = hudSlice.selectors;

/** The red fill's height: the share of the cooldown still to run (a cooldown of 0 ticks is full). */
const cooldownFractionOf = (status: AbilitySlotStatus): number =>
  status.cooldownTicks > 0 ? Math.min(1, status.cooldownRemainingTicks / status.cooldownTicks) : 1;

/** OD-9's mapping: ready wins, then a running cooldown; a runtime entry with neither is idle. */
function lookOf(status: AbilitySlotStatus | null): HudSlotLook {
  if (status === null) return 'no-data';
  if (status.isReady) return 'ready';
  return status.cooldownRemainingTicks > 0 ? 'cooldown' : 'idle';
}

/**
 * The view of `slot`: the kit entry (name, icon) and the runtime look. Memoised per slot (the
 * arguments are the kit, the slot's runtime entry and the slot id), so a publish that leaves both
 * unchanged returns the same object; components read it with `shallowEqual`.
 */
export const selectHudSlotView = createSelector(
  [
    selectHudKit,
    (state: RootState, slot: HudSlotId) => selectSlotStatus(state, slot),
    (_state: RootState, slot: HudSlotId) => slot,
  ],
  (kit, status, slot): HudSlotView => {
    const display = kit?.slots.find((entry) => entry.slot === slot);
    const look = lookOf(status);
    return {
      displayName: display?.displayName ?? null,
      iconAssetId: display?.iconAssetId ?? null,
      look,
      cooldownFraction: look === 'cooldown' && status !== null ? cooldownFractionOf(status) : null,
      blockedBy: status?.blockedBy ?? null,
    };
  },
);
