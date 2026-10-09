import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, sessionAt } from '../testStore';
import { MainMenuScreen } from './MainMenuScreen';

describe('MainMenuScreen', () => {
  it('lists the five options in order, with the profile under its content name', () => {
    const html = renderWithStore(<MainMenuScreen />, { session: sessionAt('menu') });
    expect(buttonNames(html)).toEqual([
      STRINGS.menu.startMatch,
      STRINGS.menu.loadouts,
      'Chronicle',
      STRINGS.menu.settings,
      STRINGS.menu.about,
    ]);
    expect(html).toContain(`aria-label="${STRINGS.menu.navLabel}"`);
    expect(html).toContain('data-background="test-neutral"');
  });

  it('shows the cancellation banner after a select timeout', () => {
    const html = renderWithStore(<MainMenuScreen />, {
      session: sessionAt('menu', { reason: 'select-timeout' }),
    });
    expect(html).toContain('role="status"');
    expect(html).toContain(STRINGS.reasonBanners['select-timeout']);
  });

  it('shows no banner without a reason or for a reason with no message', () => {
    for (const session of [sessionAt('menu'), sessionAt('menu', { reason: 'unknown' })]) {
      expect(renderWithStore(<MainMenuScreen />, { session })).not.toContain('role="status"');
    }
  });
});
