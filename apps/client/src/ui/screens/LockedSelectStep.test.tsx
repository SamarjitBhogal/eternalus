import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import type { DisplayCatalogue } from '../../bridge/catalogue.types';
import type { RosterEntry } from '../../bridge/events';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { STRINGS } from '../strings';
import { accessibleNames, renderWithStore, TEST_CONTENT, withoutPreloads } from '../testStore';
import { LockedSelectStep } from './LockedSelectStep';
import styles from './LockedSelectStep.module.css';

const { characterSelect: text } = STRINGS;

const ESC: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];

/** The player (light Rover) and one bot, as LOCK IN filled them. */
const ALLIES: readonly RosterEntry[] = [
  {
    legendId: 'light-1',
    displayName: 'Ada',
    classId: 'magus',
    specId: 'oracle',
    isBot: false,
    isPlayer: true,
    isRover: true,
    team: 'light',
  },
  {
    legendId: 'light-2',
    displayName: 'Magus 2',
    classId: 'magus',
    specId: 'catalyst',
    isBot: true,
    isPlayer: false,
    isRover: false,
    team: 'light',
  },
];

function render(
  selection: { readonly classId: string | null; readonly specId: string | null },
  content: DisplayCatalogue = TEST_CONTENT,
): string {
  return renderWithStore(<LockedSelectStep />, {
    content,
    settings: { ...settingsSlice.getInitialState(), bindings: ESC },
    matchSetup: {
      ...matchSetupSlice.getInitialState(),
      playerTeam: 'light',
      selection,
      allies: ALLIES,
      isLockedIn: true,
    },
  });
}

/** The `src` of the centre figure. */
const figureSrc = (html: string): string | undefined =>
  new RegExp(`<img src="([^"]+)"[^>]*class="${styles.figure ?? '-'}"`).exec(html)?.[1];

describe('LockedSelectStep', () => {
  it('renders nothing before a class is picked', () => {
    expect(render({ classId: null, specId: null })).toBe('');
  });

  it("shows the locked Legend's details, the Legend in the centre and the allies (DEC-60)", () => {
    const html = withoutPreloads(render({ classId: 'magus', specId: 'oracle' }));

    expect(html).toContain('>Elarion</h3>');
    expect(html.split('role="meter"').length - 1).toBe(3);
    expect(figureSrc(html)).toBe('/assets/test/oracle-card-art.webp');
    expect(html).toContain(`aria-label="${text.rosterLabel('Light')}"`);
    // The bot's tile shows its filled Legend (DEC-61), not its class sigil.
    expect(html).toMatch(/<li [^>]*data-look="legend"/);
  });

  it('gives the Legend title the focus LOCK IN had, and announces no new words', () => {
    const html = render({ classId: 'magus', specId: 'oracle' });

    expect(html).toMatch(/<h3[^>]*tabindex="-1"[^>]*>Elarion<\/h3>/);
    expect(html).not.toContain('aria-live');
  });

  it('hides the cards, the breadcrumb, LOCK IN and Back (Esc) (DEC-60)', () => {
    const html = render({ classId: 'magus', specId: 'oracle' });

    expect(html).not.toContain('role="radiogroup"');
    expect(html).not.toContain(text.legendBreadcrumb('Magus'));
    expect(accessibleNames(html, 'button')).toEqual([]);
    expect(html).not.toContain(`>${text.lockIn}<`);
    expect(html).not.toContain(`>${text.back}<`);
  });

  it('stands the class model, else the class card art, in for a Legend without card art', () => {
    const withoutLegendArt: DisplayCatalogue = {
      ...TEST_CONTENT,
      legendClasses: TEST_CONTENT.legendClasses.map((card) => ({
        ...card,
        specs: card.specs.map((spec) => ({ ...spec, art: { ...spec.art, card: null } })),
      })),
    };

    expect(figureSrc(render({ classId: 'magus', specId: 'oracle' }, withoutLegendArt))).toBe(
      '/assets/test/magus-model.webp',
    );
    expect(figureSrc(render({ classId: 'warrior', specId: 'knight' }))).toBe(
      '/assets/test/warrior-card-art.webp',
    );
  });
});
