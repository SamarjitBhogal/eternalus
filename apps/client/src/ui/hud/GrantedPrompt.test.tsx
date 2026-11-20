import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER, figmaHudState } from '../../bridge/__fixtures__/hudFixtures';
import type { DisplayCatalogue } from '../../bridge/catalogue.types';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { GrantedPrompt } from './GrantedPrompt';
import { HUD_BINDINGS, settingsWith, withHudSetup } from './hudTestSupport';

type AbilityRow = DisplayCatalogue['abilities'][number];

const FURY_DASH: AbilityRow = {
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

/** The HUD with `grantedAbilityId` held and the catalogue knowing the Fury dash. */
const holding = (grantedAbilityId: string | null) => {
  const state = figmaHudState();
  return {
    ...withHudSetup({
      ...state,
      hud: { ...state.hud, player: { ...FIGMA_HUD_PLAYER, grantedAbilityId } },
    }),
    content: { ...TEST_CONTENT, abilities: [FURY_DASH] },
  };
};

describe('GrantedPrompt', () => {
  it('shows the bound key and the ability name while an ability is granted', () => {
    const html = renderWithStore(<GrantedPrompt />, holding('fury-dash'));

    expect(html).toMatch(/<kbd[^>]*>Space<\/kbd>/);
    expect(html).toContain('Fury Dash');
    expect(accessibleNames(html, '[role=status]')).toEqual(['Granted ability']);
  });

  it('shows the key the player rebound it to, not a literal', () => {
    const rebound = settingsWith(
      HUD_BINDINGS.map((binding) =>
        binding.action === 'granted'
          ? { action: 'granted', chords: [{ device: 'keyboard', code: 'KeyF', label: 'F' }] }
          : binding,
      ),
    );

    const html = renderWithStore(<GrantedPrompt />, { ...holding('fury-dash'), settings: rebound });

    expect(html).toMatch(/<kbd[^>]*>F<\/kbd>/);
    expect(html).not.toContain('Space');
  });

  it('is hidden while nothing is granted, before the first publish and for an unknown ability', () => {
    expect(renderWithStore(<GrantedPrompt />, holding(null))).toBe('');
    expect(renderWithStore(<GrantedPrompt />, withHudSetup({}))).toBe('');
    expect(renderWithStore(<GrantedPrompt />, holding('mystery'))).toBe('');
  });
});
