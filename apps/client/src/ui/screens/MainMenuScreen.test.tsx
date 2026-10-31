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

  it('shows no banner after a select timeout: the popup tells it (DEC-102)', () => {
    const html = renderWithStore(<MainMenuScreen />, {
      session: sessionAt('menu', { reason: 'select-timeout' }),
    });
    expect(STRINGS.reasonBanners['select-timeout']).toBeUndefined();
    expect(html).not.toContain('role="status"');
  });

  it.each([
    ['match-failed', 'Match could not start.'],
    ['match-crashed', 'The match stopped because of an error.'],
    ['load-failed', 'Loading failed.'],
  ] as const)('shows the failure banner for %s', (reason, banner) => {
    const html = renderWithStore(<MainMenuScreen />, { session: sessionAt('menu', { reason }) });
    expect(STRINGS.reasonBanners[reason]).toBe(banner);
    expect(html).toContain(`<p role="status"`);
    expect(html).toContain(banner);
  });

  it('shows no banner without a reason or for a reason with no message', () => {
    for (const session of [sessionAt('menu'), sessionAt('menu', { reason: 'unknown' })]) {
      expect(renderWithStore(<MainMenuScreen />, { session })).not.toContain('role="status"');
    }
  });
});
