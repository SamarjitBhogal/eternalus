import { describe, expect, it } from 'vitest';

import { SESSION_PHASES } from '../bridge/events';
import { matchSetupSlice } from '../bridge/slices/matchSetupSlice';
import { App } from './App';
import { STRINGS } from './strings';
import { accessibleNames, renderWithStore, sessionAt } from './testStore';

describe('App', () => {
  it.each(SESSION_PHASES.filter((phase) => phase !== 'menu'))(
    'renders a screen for the %s phase',
    (phase) => {
      const html = renderWithStore(<App />, { session: sessionAt(phase) });
      expect(html).toContain('<main');
    },
  );

  it('renders the home screen for the menu phase on the home route', () => {
    const html = renderWithStore(<App />, { session: sessionAt('menu') });
    expect(html).toContain(STRINGS.menu.startMatch);
  });

  it('shows the select-timeout popup over every menu route, and in no other phase (DEC-102)', () => {
    const title = STRINGS.selectTimeoutPopup.title;
    const at = (session: ReturnType<typeof sessionAt>) => renderWithStore(<App />, { session });
    for (const menuRoute of ['home', 'settings'] as const) {
      const html = at(sessionAt('menu', { menuRoute, reason: 'select-timeout' }));
      expect(html).toContain(title);
      expect(html.indexOf(title)).toBeGreaterThan(html.indexOf('<main'));
    }
    expect(at(sessionAt('menu'))).not.toContain(title);
    expect(at(sessionAt('loading', { reason: 'select-timeout' }))).not.toContain(title);
  });

  it.each([
    ['loadouts', STRINGS.loadouts.title],
    ['profile', 'Chronicle'],
    ['settings', STRINGS.placeholder.routes.settings],
    ['about', STRINGS.about.title],
  ] as const)('renders the %s route', (menuRoute, heading) => {
    const html = renderWithStore(<App />, { session: sessionAt('menu', { menuRoute }) });
    expect(html).toContain(heading);
    expect(html).not.toContain(STRINGS.menu.startMatch);
  });

  it.each(SESSION_PHASES.filter((phase) => phase !== 'match'))(
    'renders no viewport in the %s phase (T-APP-1)',
    (phase) => {
      const html = renderWithStore(<App viewport={<canvas data-testid="viewport" />} />, {
        session: sessionAt(phase),
      });
      expect(html).not.toContain('data-testid="viewport"');
    },
  );

  it('renders the viewport in the match phase (T-APP-1)', () => {
    const html = renderWithStore(<App viewport={<canvas data-testid="viewport" />} />, {
      session: sessionAt('match'),
    });
    expect(html).toContain('data-testid="viewport"');
  });

  it('renders the class step in character select, then the Legend step once a class is selected (T-APP-2)', () => {
    const at = (classId: string | null): string =>
      renderWithStore(<App viewport={<canvas data-testid="viewport" />} />, {
        session: sessionAt('character-select'),
        matchSetup: {
          ...matchSetupSlice.getInitialState(),
          selection: { classId, specId: null },
        },
      });
    const classStep = at(null);
    const legendStep = at('magus');

    expect(accessibleNames(classStep, '[role=radiogroup]')).toEqual([
      STRINGS.characterSelect.chooseClass,
    ]);
    expect(legendStep).toContain('Magus &gt; Choose Your Legend');
    expect(legendStep).not.toContain(STRINGS.characterSelect.chooseClass);
    for (const html of [classStep, legendStep]) {
      expect(html).not.toContain(STRINGS.placeholder.body);
      expect(html).not.toContain('data-testid="viewport"');
    }
  });

  it('renders the match screen in the match phase: the viewport under the HUD (T-APP-3)', () => {
    const html = renderWithStore(<App viewport={<canvas data-testid="viewport" />} />, {
      session: sessionAt('match'),
    });

    expect(accessibleNames(html, 'section')).toEqual([STRINGS.hud.label]);
    expect(html.indexOf('data-testid="viewport"')).toBeGreaterThan(-1);
    expect(html.indexOf('data-testid="viewport"')).toBeLessThan(html.indexOf(STRINGS.hud.label));
    expect(html).not.toContain(STRINGS.placeholder.body);
  });
});
