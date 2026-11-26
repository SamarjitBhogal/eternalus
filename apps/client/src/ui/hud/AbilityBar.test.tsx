import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../../bridge/__fixtures__/hudFixtures';

import { renderWithStore } from '../testStore';
import styles from './AbilitySlot.module.css';
import { AbilityBar } from './AbilityBar';
import { withHudSetup, settingsWith, withBinding } from './hudTestSupport';

const glyphs = (html: string) => [...html.matchAll(/<kbd[^>]*>([^<]*)<\/kbd>/g)].map(([, l]) => l);

describe('AbilityBar', () => {
  it('shows the key glyphs in display order 4, 1, 2, 3', () => {
    expect(glyphs(renderWithStore(<AbilityBar />, withHudSetup(figmaHudState())))).toEqual([
      '4',
      '1',
      '2',
      '3',
    ]);
  });

  it('shows R and no 4 once the ultimate is rebound to R (FR-081)', () => {
    const html = renderWithStore(<AbilityBar />, {
      ...withHudSetup(figmaHudState()),
      settings: settingsWith(
        withBinding('ability-4', { device: 'keyboard', code: 'KeyR', label: 'R' }),
      ),
    });
    expect(glyphs(html)).toEqual(['R', '1', '2', '3']);
  });

  it('draws the charge bar, then the ultimate, the charge boxes and the abilities', () => {
    const html = renderWithStore(<AbilityBar />, withHudSetup(figmaHudState()));
    const order = [
      'aria-label="Ultimate charge"',
      'data-slot="ability-4"',
      'aria-label="Ultimate charges"',
      'data-slot="ability-1"',
    ];
    const at = order.map((marker) => html.indexOf(marker));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  describe('the slot selected for aiming', () => {
    const slotTag = (html: string, slot: string): string =>
      new RegExp(`<div[^>]*data-slot="${slot}"[^>]*>`).exec(html)?.[0] ?? 'missing';
    const aiming = (slot: 'ability-1' | 'ability-2' | null) => {
      const state = figmaHudState();
      return withHudSetup({ ...state, hud: { ...state.hud, aimingSlot: slot } });
    };

    it('is outlined and flagged, and no other slot is', () => {
      const html = renderWithStore(<AbilityBar />, aiming('ability-2'));

      expect(slotTag(html, 'ability-2')).toContain(String(styles.isAiming));
      expect(slotTag(html, 'ability-2')).toContain('data-aiming="true"');
      for (const other of ['ability-1', 'ability-3', 'ability-4']) {
        expect(slotTag(html, other)).not.toContain(String(styles.isAiming));
        expect(slotTag(html, other)).toContain('data-aiming="false"');
      }
    });

    it('moves with the selection and is gone when none is selected', () => {
      expect(slotTag(renderWithStore(<AbilityBar />, aiming('ability-1')), 'ability-1')).toContain(
        'data-aiming="true"',
      );
      expect(renderWithStore(<AbilityBar />, aiming(null))).not.toContain('data-aiming="true"');
    });
  });

  it('names an ability not built yet "Not yet available" and a blocked ultimate "Not charged"', () => {
    const state = figmaHudState();
    const player = state.hud.player;
    if (player === null) throw new Error('no player');
    const slots = player.slots.map((entry) =>
      entry.slot === 'ability-1'
        ? { ...entry, isReady: false, cooldownRemainingTicks: 0, blockedBy: 'unavailable' as const }
        : entry.slot === 'ability-4'
          ? { ...entry, isReady: false, charge: null, blockedBy: 'not-charged' as const }
          : entry,
    );
    const html = renderWithStore(
      <AbilityBar />,
      withHudSetup({ ...state, hud: { ...state.hud, player: { ...player, slots } } }),
    );

    expect(html).toMatch(/aria-label="[^"]*Ability 1[^"]*Not yet available"/);
    expect(html).toMatch(/aria-label="[^"]*Ultimate[^"]*Not charged"/);
    expect(html).not.toMatch(/Ultimate[^"]*ready"/);
  });
});
