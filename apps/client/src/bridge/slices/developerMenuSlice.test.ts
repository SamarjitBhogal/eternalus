import { describe, expect, it } from 'vitest';

import { developerMenuSlice } from './developerMenuSlice';

const { changed, reset } = developerMenuSlice.actions;
const OPEN = {
  isOpen: true,
  mobs: [{ id: 'light-minion', label: 'Light Minion' }],
  origins: [{ id: 'gate-1', label: 'gate-1' }],
  humanLegendId: 'entity-1',
};

describe('developerMenuSlice', () => {
  it('starts closed', () => {
    expect(developerMenuSlice.getInitialState().isOpen).toBe(false);
  });

  it('stores what the game publishes and clears it on reset', () => {
    const published = developerMenuSlice.reducer(undefined, changed(OPEN));
    expect(developerMenuSlice.selectors.selectDeveloperMenu({ developerMenu: published })).toEqual(
      OPEN,
    );
    expect(developerMenuSlice.reducer(published, reset()).isOpen).toBe(false);
  });
});
