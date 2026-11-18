import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** One weapon a class may carry as its primary weapon, as the Loadout screen lists it. */
type LoadoutWeaponOption = { readonly id: string; readonly displayName: string };

/** The primary weapons of one class and the one auto-build picks (08 "Pre-game configuration"). */
export type ClassLoadoutOptions = {
  readonly defaultWeaponId: string;
  readonly weapons: readonly LoadoutWeaponOption[];
};

/**
 * What the Loadout screen shows (08 "Saved to the profile"), keyed by class id.
 * `options`: what each class may take, from content. `saved`: the weapon the profile saved for a
 * class, already repaired. `repaired`: the classes whose saved weapon no longer exists, so the
 * default replaced it.
 */
export type LoadoutsSliceState = {
  readonly options: Readonly<Record<string, ClassLoadoutOptions>>;
  readonly saved: Readonly<Record<string, string>>;
  readonly repaired: readonly string[];
};

// Options start empty: they come from core content, which bridge/ may not import. The game
// publishes them, with the saved loadouts, when it has loaded both.
const initialState: LoadoutsSliceState = { options: {}, saved: {}, repaired: [] };

/** Saved loadouts and the choices each class offers, replaced whole each time the game publishes. */
export const loadoutsSlice = createSlice({
  name: 'loadouts',
  initialState,
  reducers: {
    loadoutsChanged(_state, action: PayloadAction<LoadoutsSliceState>) {
      return action.payload;
    },
  },
  selectors: {
    /** What `classId` may carry, or `null` while the game has not published it. */
    selectClassOptions: (state, classId: string): ClassLoadoutOptions | null =>
      state.options[classId] ?? null,
    /** The weapon to show for `classId`: the saved one, else the class default, else `null`. */
    selectChosenWeaponId: (state, classId: string): string | null =>
      state.saved[classId] ?? state.options[classId]?.defaultWeaponId ?? null,
    /** True when the weapon saved for `classId` no longer exists and the default replaced it. */
    selectWasRepaired: (state, classId: string): boolean => state.repaired.includes(classId),
  },
});
