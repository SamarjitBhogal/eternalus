import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** One weapon a Legend may carry as its primary weapon, as the Loadout screen lists it. */
type LoadoutWeaponOption = { readonly id: string; readonly displayName: string };

/**
 * The primary weapons of one Legend and the one auto-build picks (08 "Pre-game configuration").
 * `classId` is the Legend's class: core validates and spawns a loadout by class.
 */
export type LegendLoadoutOptions = {
  readonly classId: string;
  readonly defaultWeaponId: string;
  readonly weapons: readonly LoadoutWeaponOption[];
};

/**
 * What the Loadout screen shows (08 "Saved to the profile"), keyed by the Legend's `specId`
 * (DEC-354 (1)). `options`: what each Legend may take, from content. `saved`: the weapon the
 * profile saved for a Legend, already repaired. `repaired`: the Legends whose saved weapon no
 * longer exists, so the default replaced it.
 */
export type LoadoutsSliceState = {
  readonly options: Readonly<Record<string, LegendLoadoutOptions>>;
  readonly saved: Readonly<Record<string, string>>;
  readonly repaired: readonly string[];
};

// Options start empty: they come from core content, which bridge/ may not import. The game
// publishes them, with the saved loadouts, when it has loaded both.
const initialState: LoadoutsSliceState = { options: {}, saved: {}, repaired: [] };

/** Saved loadouts and the choices each Legend offers, replaced whole each time the game publishes. */
export const loadoutsSlice = createSlice({
  name: 'loadouts',
  initialState,
  reducers: {
    loadoutsChanged(_state, action: PayloadAction<LoadoutsSliceState>) {
      return action.payload;
    },
  },
  selectors: {
    /** What the Legend `specId` may carry, or `null` while the game has not published it. */
    selectLegendOptions: (state, specId: string): LegendLoadoutOptions | null =>
      state.options[specId] ?? null,
    /** The weapon to show for `specId`: the saved one, else the auto-build's, else `null`. */
    selectChosenWeaponId: (state, specId: string): string | null =>
      state.saved[specId] ?? state.options[specId]?.defaultWeaponId ?? null,
    /** True when the weapon saved for `specId` no longer exists and the default replaced it. */
    selectWasRepaired: (state, specId: string): boolean => state.repaired.includes(specId),
  },
});
