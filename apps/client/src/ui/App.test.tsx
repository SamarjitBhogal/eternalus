import { describe, expect, it } from 'vitest';

import { SESSION_PHASES } from '../bridge/events';
import { App } from './App';
import { STRINGS } from './strings';
import { renderWithStore, sessionAt } from './testStore';

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

  it('passes the viewport to the screen (the match placeholder shows it)', () => {
    const html = renderWithStore(<App viewport={<canvas data-testid="viewport" />} />, {
      session: sessionAt('match'),
    });
    expect(html).toContain('data-testid="viewport"');
  });
});
