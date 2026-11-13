import { describe, expect, it } from 'vitest';

import type { DeveloperMenuState } from '../../bridge/developerMenu.types';
import { developerMenuSlice } from '../../bridge/slices/developerMenuSlice';
import { buttonNames, renderWithStore } from '../testStore';
import { DeveloperMenu } from './DeveloperMenu';

const STATE: DeveloperMenuState = {
  isOpen: true,
  mobs: [{ id: 'light-minion', label: 'Light Minion' }],
  origins: [{ id: 'gate-a', label: 'gate-a (gate)' }],
};

const render = (state: DeveloperMenuState): string =>
  renderWithStore(<DeveloperMenu />, {
    developerMenu: { ...developerMenuSlice.getInitialState(), ...state },
  });

describe('DeveloperMenu', () => {
  it('is not mounted in the initial state (menu disabled or never opened)', () => {
    expect(
      renderWithStore(<DeveloperMenu />, { developerMenu: developerMenuSlice.getInitialState() }),
    ).toBe('');
  });

  it('is not mounted while it is closed', () => {
    expect(render({ ...STATE, isOpen: false })).toBe('');
  });

  it('shows the pickers and every gameplay button when enabled and open', () => {
    const html = render(STATE);
    expect(html).toContain('aria-label="Developer menu"');
    expect(html).toContain('Light Minion');
    expect(html).toContain('gate-a (gate)');
    expect(buttonNames(html)).toEqual(['Spawn', 'Add', 'Remove']);
  });
});
