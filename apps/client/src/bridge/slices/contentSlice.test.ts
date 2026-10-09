import { describe, expect, it } from 'vitest';

import type { DisplayCatalogue } from '../events';
import { contentSlice } from './contentSlice';

const CATALOGUE: DisplayCatalogue = {
  legendClasses: [{ classId: 'warrior', displayName: 'Warrior', blurb: 'Fast.', specs: [] }],
  backgroundSets: [
    { id: 'menu', team: 'neutral', layers: [] },
    { id: 'light-a', team: 'light', layers: [] },
    { id: 'light-b', team: 'light', layers: [] },
  ],
  profileDisplayName: 'Chronicle',
};

const { selectBackgroundSet, selectLegendClasses, selectProfileDisplayName } =
  contentSlice.selectors;

describe('contentSlice', () => {
  it('is empty until the catalogue loads, then holds it', () => {
    expect(selectLegendClasses({ content: contentSlice.getInitialState() })).toEqual([]);
    const content = contentSlice.reducer(
      undefined,
      contentSlice.actions.catalogueLoaded(CATALOGUE),
    );
    expect(selectLegendClasses({ content })).toBe(CATALOGUE.legendClasses);
    expect(selectProfileDisplayName({ content })).toBe('Chronicle');
  });

  it('selects the first background set of a team, or undefined', () => {
    const content = contentSlice.reducer(
      undefined,
      contentSlice.actions.catalogueLoaded(CATALOGUE),
    );
    expect(selectBackgroundSet({ content }, 'light')?.id).toBe('light-a');
    expect(selectBackgroundSet({ content }, 'neutral')?.id).toBe('menu');
    expect(selectBackgroundSet({ content }, 'dark')).toBeUndefined();
  });
});
