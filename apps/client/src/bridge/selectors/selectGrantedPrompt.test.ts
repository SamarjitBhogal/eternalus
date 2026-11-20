import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../__fixtures__/hudFixtures';
import type { DisplayCatalogue } from '../catalogue.types';
import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import { createAppStore } from '../store';
import { selectGrantedPrompt } from './selectGrantedPrompt';

const FURY_DASH: DisplayCatalogue['abilities'][number] = {
  id: 'fury-dash',
  displayName: 'Fury Dash',
  description: 'Dash.',
  slot: 'granted',
  aetherCost: 0,
  cooldownSeconds: 0,
  isAvailable: true,
  steps: [],
  usesAim: false,
};

const storeHolding = (grantedAbilityId: string | null) => {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      abilities: [FURY_DASH],
    }),
  );
  store.dispatch(hudSlice.actions.hudStateChanged({ ...FIGMA_HUD_PLAYER, grantedAbilityId }));
  return store;
};

describe('selectGrantedPrompt', () => {
  it('is the display name of the granted ability', () => {
    expect(selectGrantedPrompt(storeHolding('fury-dash').getState())).toBe('Fury Dash');
  });

  it('is null while nothing is granted, with no player, or for an id the catalogue lacks', () => {
    expect(selectGrantedPrompt(storeHolding(null).getState())).toBeNull();
    expect(selectGrantedPrompt(createAppStore().getState())).toBeNull();
    expect(selectGrantedPrompt(storeHolding('mystery').getState())).toBeNull();
  });
});
