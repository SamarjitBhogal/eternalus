import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** What the player has switched on or off in the match view (not persisted; DEC-147). */
type ViewSliceState = {
  /** The minimap key's state; every match starts with the minimap shown. */
  readonly isMinimapShown: boolean;
};

const initialState: ViewSliceState = { isMinimapShown: true };

/** The player's view toggles, fed by `minimap-visibility`; reset by every `match-setup`. */
export const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    minimapShownChanged(state, action: PayloadAction<boolean>) {
      state.isMinimapShown = action.payload;
    },
    reset: () => initialState,
  },
  selectors: {
    selectIsMinimapShown: (state) => state.isMinimapShown,
  },
});
