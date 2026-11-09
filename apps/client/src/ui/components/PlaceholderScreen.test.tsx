import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import type { ScreenProps } from '../screens/screen.types';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, sessionAt } from '../testStore';
import { PlaceholderScreen } from './PlaceholderScreen';

/** As `App` mounts it: every screen gets the viewport, which this one must never render. */
const Screen: ComponentType<ScreenProps> = PlaceholderScreen;

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

  it('never renders the viewport it is given', () => {
    const html = renderWithStore(<Screen viewport={<canvas data-testid="viewport" />} />, {
      session: sessionAt('loading'),
    });
    expect(html).toContain(STRINGS.placeholder.phases.loading);
    expect(html).not.toContain('data-testid="viewport"');
  });
});
