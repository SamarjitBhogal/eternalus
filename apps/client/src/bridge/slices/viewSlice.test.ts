import { describe, expect, it } from 'vitest';

import { viewSlice } from './viewSlice';

const { minimapShownChanged, reset } = viewSlice.actions;
const { selectIsMinimapShown } = viewSlice.selectors;

describe('viewSlice', () => {
  it('starts with the minimap shown, follows the player, and resets to shown', () => {
    const initial = viewSlice.getInitialState();
    expect(selectIsMinimapShown({ view: initial })).toBe(true);
    const hidden = viewSlice.reducer(initial, minimapShownChanged(false));
    expect(selectIsMinimapShown({ view: hidden })).toBe(false);
    expect(viewSlice.reducer(hidden, reset())).toEqual(initial);
  });
});
