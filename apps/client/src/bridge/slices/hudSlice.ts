import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { HudSlotId } from '../Binding.types';
import type { AbilitySlotStatus, Announcement, PlayerHudSnapshot } from '../hud.types';

// This file must not import events.ts (events.ts imports the HUD display types).

/** What the HUD shows of the human Legend, and the announcer lines. */
type HudSliceState = {
  /** `null` until the first `hud-state` of a match. */
  readonly player: PlayerHudSnapshot | null;
  readonly announcements: readonly Announcement[];
};

const initialState: HudSliceState = { player: null, announcements: [] };

/** The slot whose `charge` is the ultimate meter (05 §15). */
const ULTIMATE_SLOT: HudSlotId = 'ability-4';

/** The runtime entry of `slot`, or `null` while it has none. */
function slotStatus(state: HudSliceState, slot: HudSlotId): AbilitySlotStatus | null {
  return state.player?.slots.find((entry) => entry.slot === slot) ?? null;
}

/** HUD state, fed by `hud-state` and `announcement`; reset by every `match-setup`. */
export const hudSlice = createSlice({
  name: 'hud',
  initialState,
  reducers: {
    // The snapshot is readonly and stored as given, so the reducer returns new state.
    hudStateChanged: (state, action: PayloadAction<PlayerHudSnapshot | null>) => ({
      player: action.payload,
      announcements: state.announcements,
    }),
    announced(state, action: PayloadAction<Announcement>) {
      state.announcements.push(action.payload);
    },
    reset: () => initialState,
  },
  selectors: {
    selectHealth: (state) => state.player?.health ?? null,
    selectMaxHealth: (state) => state.player?.maxHealth ?? null,
    selectAether: (state) => state.player?.aether ?? null,
    selectMaxAether: (state) => state.player?.maxAether ?? null,
    selectLevel: (state) => state.player?.level ?? null,
    /** XP through the current level, 0..1; `null` while either value is missing or `xpToNext <= 0`. */
    selectXpFraction: (state): number | null => {
      const xp = state.player?.xp ?? null;
      const xpToNext = state.player?.xpToNext ?? null;
      if (xp === null || xpToNext === null || xpToNext <= 0) return null;
      return Math.min(1, Math.max(0, xp / xpToNext));
    },
    selectWeaponProgress: (state) => state.player?.weaponProgress ?? null,
    selectUltimatePips: (state) => state.player?.ultimatePips ?? null,
    /** The runtime entry of `slot`, or `null` while it has none. */
    selectSlotStatus: slotStatus,
    /** The ultimate meter (`ability-4`'s `charge`), or `null`. */
    selectUltimateCharge: (state) => slotStatus(state, ULTIMATE_SLOT)?.charge ?? null,
  },
});
