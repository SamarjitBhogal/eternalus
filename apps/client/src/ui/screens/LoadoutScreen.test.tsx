import { describe, expect, it } from 'vitest';

import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { LoadoutScreen } from './LoadoutScreen';

const FIRST_CLASS = TEST_CONTENT.legendClasses[0];

const LOADOUTS: LoadoutsSliceState = {
  options: {
    [FIRST_CLASS?.classId ?? '']: {
      defaultWeaponId: 'raptor-talons',
      weapons: [
        { id: 'raptor-talons', displayName: 'Raptor Talons' },
        { id: 'wuuthrad', displayName: 'Wuuthrad' },
      ],
    },
  },
  saved: { [FIRST_CLASS?.classId ?? '']: 'wuuthrad' },
  repaired: [],
};

const radioTags = (html: string): string[] => html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [];

describe('LoadoutScreen', () => {
  it('offers one radio per playable class and leaves the locked class out', () => {
    const html = renderWithStore(<LoadoutScreen />);
    const playable = TEST_CONTENT.legendClasses.filter((card) => card.status === 'available');
    expect(playable.map((card) => card.classId)).toEqual(['warrior', 'sentinel', 'magus']);
    const names = buttonNames(html);
    for (const card of playable) expect(names).toContain(card.displayName);
    expect(html).not.toContain('Harbinger');
    expect(radioTags(html)).toHaveLength(3);
  });

  it('checks the first class, gives it the one tab stop and the autofocus', () => {
    const tags = radioTags(renderWithStore(<LoadoutScreen />));
    expect(tags[0]).toContain('aria-checked="true"');
    expect(tags[0]).toContain('tabindex="0"');
    expect(tags[0]).toContain('autofocus');
    expect(tags[1]).toContain('aria-checked="false"');
    expect(tags[1]).toContain('tabindex="-1"');
  });

  it('says the weapons are unavailable, and names the start weapon, until they are published', () => {
    const html = renderWithStore(<LoadoutScreen />);
    expect(html).toContain(STRINGS.loadouts.weaponsUnavailable);
    expect(buttonNames(html)).toContain(STRINGS.loadouts.save);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Save loadout<\/button>/);
  });

  it('lists the weapons the class offers with the saved one checked', () => {
    const html = renderWithStore(<LoadoutScreen />, { loadouts: LOADOUTS });
    const names = buttonNames(html);
    expect(names).toContain('Raptor Talons');
    expect(names).toContain('Wuuthrad');
    expect(html).toMatch(/role="radio" aria-checked="true"[^>]*>Wuuthrad<\/button>/);
    expect(html).toMatch(/role="radio" aria-checked="false"[^>]*>Raptor Talons<\/button>/);
    expect(html).not.toContain(STRINGS.loadouts.weaponsUnavailable);
  });

  it('shows every slot that waits for the loadout model as a disabled row', () => {
    const html = renderWithStore(<LoadoutScreen />);
    expect(html.match(/<li aria-disabled="true">/g)).toHaveLength(
      STRINGS.loadouts.pendingSlots.length,
    );
    for (const slot of STRINGS.loadouts.pendingSlots) expect(html).toContain(slot);
  });

  it('tells the player when the saved weapon was repaired to the default', () => {
    const repaired = { ...LOADOUTS, repaired: [FIRST_CLASS?.classId ?? ''] };
    expect(renderWithStore(<LoadoutScreen />, { loadouts: repaired })).toContain(
      STRINGS.loadouts.repaired,
    );
    expect(renderWithStore(<LoadoutScreen />, { loadouts: LOADOUTS })).not.toContain(
      STRINGS.loadouts.repaired,
    );
  });

  it('ends with the Save button, then the Back button', () => {
    const names = buttonNames(renderWithStore(<LoadoutScreen />));
    expect(names.slice(-2)).toEqual([STRINGS.loadouts.save, STRINGS.back]);
  });
});
