import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, sessionAt } from '../testStore';
import { PlaceholderScreen } from './PlaceholderScreen';

describe('PlaceholderScreen', () => {
  it('names the phase and offers no exit where the session moves on by itself', () => {
    const html = renderWithStore(<PlaceholderScreen />, { session: sessionAt('loading') });
    expect(html).toContain(STRINGS.placeholder.phases.loading);
    expect(buttonNames(html)).toEqual([]);
  });

  it('names the menu route and goes back home from it', () => {
    const html = renderWithStore(<PlaceholderScreen />, {
      session: sessionAt('menu', { menuRoute: 'settings' }),
    });
    expect(html).toContain(STRINGS.placeholder.routes.settings);
    expect(buttonNames(html)).toEqual([STRINGS.back]);
  });

  it('shows the viewport in the match and offers to leave', () => {
    const html = renderWithStore(<PlaceholderScreen viewport={<canvas />} />, {
      session: sessionAt('match'),
    });
    expect(html).toContain('<canvas>');
    expect(buttonNames(html)).toEqual([STRINGS.placeholder.leaveMatch]);
  });
});
