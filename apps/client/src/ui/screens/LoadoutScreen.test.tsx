import { describe, expect, it } from 'vitest';

import { specCardFixture } from '../../bridge/__fixtures__/catalogueFixtures';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { LoadoutScreen } from './LoadoutScreen';

const FIRST_CLASS = TEST_CONTENT.legendClasses[0];
/** The first class's first Legend: the one the screen opens on. */
const FIRST_LEGEND = FIRST_CLASS?.specs[0]?.specId ?? '';

const LOADOUTS: LoadoutsSliceState = {
  options: {
    [FIRST_LEGEND]: {
      defaultWeaponId: 'raptor-talons',
      weapons: [
        { id: 'raptor-talons', displayName: 'Raptor Talons' },
        { id: 'wuuthrad', displayName: 'Wuuthrad' },
      ],
    },
  },
  saved: { [FIRST_LEGEND]: 'wuuthrad' },
  repaired: [],
};

const radioTags = (html: string): string[] => html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [];

/** The radio buttons of the radio group labelled `label`, as HTML. */
const groupRadios = (html: string, label: string): string[] =>
  radioTags(
    new RegExp(`role="radiogroup" aria-label="${label}"[^>]*>(.*?)</div>`).exec(html)?.[1] ?? '',
  );

describe('LoadoutScreen', () => {
  it('offers one radio per playable class and leaves the locked class out', () => {
    const html = renderWithStore(<LoadoutScreen />);
    const playable = TEST_CONTENT.legendClasses.filter((card) => card.status === 'available');
    expect(playable.map((card) => card.classId)).toEqual(['warrior', 'sentinel', 'magus']);
    const names = buttonNames(html);
    for (const card of playable) expect(names).toContain(card.displayName);
    expect(html).not.toContain('Harbinger');
    const locked = TEST_CONTENT.legendClasses.find((card) => card.status === 'locked');
    expect(locked?.displayName).toBe('Harbinger');
    expect(html).not.toContain(locked?.blurb);
    expect(groupRadios(html, STRINGS.loadouts.classGroup)).toHaveLength(3);
  });

  it("offers a Legend radio with the picked class's available Legends, the first one checked", () => {
    const warrior = TEST_CONTENT.legendClasses.find((card) => card.classId === 'warrior');
    const content = {
      ...TEST_CONTENT,
      legendClasses: TEST_CONTENT.legendClasses.map((card) =>
        card === warrior
          ? {
              ...card,
              specs: [
                specCardFixture({ specId: 'knight', displayName: 'Templar' }),
                specCardFixture({ specId: 'assassin', displayName: 'Zealot', status: 'locked' }),
                specCardFixture({ specId: 'paladin', displayName: 'Paladin' }),
              ],
            }
          : card,
      ),
    };
    const html = renderWithStore(<LoadoutScreen />, { content });
    const legends = groupRadios(html, STRINGS.loadouts.legendGroup);
    expect(legends).toHaveLength(2);
    expect(legends[0]).toContain('aria-checked="true"');
    expect(legends[0]).toContain('tabindex="0"');
    expect(legends[1]).toContain('aria-checked="false"');
    expect(html).toContain(`<h3>${STRINGS.loadouts.legendGroup}</h3>`);
    expect(buttonNames(html)).toEqual(expect.arrayContaining(['Templar', 'Paladin']));
    expect(html).not.toContain('Zealot');
  });

  it('checks the first class, gives it the one tab stop and the autofocus', () => {
    const tags = radioTags(renderWithStore(<LoadoutScreen />));
    expect(tags[0]).toContain('aria-checked="true"');
    expect(tags[0]).toContain('tabindex="0"');
    expect(tags[0]).toContain('autofocus');
    expect(tags[1]).toContain('aria-checked="false"');
    expect(tags[1]).toContain('tabindex="-1"');
  });

  it('says the weapons are unavailable until they are published, and Save is disabled', () => {
    const html = renderWithStore(<LoadoutScreen />);
    expect(html).toContain(STRINGS.loadouts.weaponsUnavailable);
    expect(buttonNames(html)).toContain(STRINGS.loadouts.save);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Save loadout<\/button>/);
  });

  it('lists the weapons the Legend offers with the saved one checked', () => {
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
    const repaired = { ...LOADOUTS, repaired: [FIRST_LEGEND] };
    expect(renderWithStore(<LoadoutScreen />, { loadouts: repaired })).toContain(
      STRINGS.loadouts.repaired,
    );
    expect(renderWithStore(<LoadoutScreen />, { loadouts: LOADOUTS })).not.toContain(
      STRINGS.loadouts.repaired,
    );
  });

  it('ends with the Auto-build button, then Save, then Back', () => {
    const names = buttonNames(renderWithStore(<LoadoutScreen />));
    expect(names.slice(-3)).toEqual([
      STRINGS.loadouts.autoBuild,
      STRINGS.loadouts.save,
      STRINGS.back,
    ]);
  });
});
