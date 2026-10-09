import { describe, expect, it } from 'vitest';

import { placeholderCatalogue } from './placeholderCatalogue';

describe('placeholderCatalogue', () => {
  const catalogue = placeholderCatalogue.load();

  it('lists the three MVP classes with blurbs and post-MVP spec slots', () => {
    expect(catalogue.legendClasses.map((card) => card.classId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
    ]);
    for (const card of catalogue.legendClasses) {
      expect(card.blurb.length).toBeGreaterThan(0);
      expect(card.specs.length).toBeGreaterThan(0);
    }
  });

  it('has a background set for the menu and for each team, coloured by token names only', () => {
    expect(catalogue.backgroundSets.map((set) => set.team).sort()).toEqual([
      'dark',
      'light',
      'neutral',
    ]);
    for (const set of catalogue.backgroundSets) {
      for (const layer of set.layers) {
        const tokens = layer.kind === 'gradient' ? layer.stops : [];
        expect(tokens.every((token) => token.startsWith('--'))).toBe(true);
      }
    }
    expect(catalogue.profileDisplayName).toBe('Chronicle');
  });
});
