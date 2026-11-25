import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { renderWithStore } from '../testStore';
import { ReconnectingNotice } from './ReconnectingNotice';

describe('ReconnectingNotice', () => {
  it('shows "Reconnecting..." while the Duel connection is reconnecting', () => {
    const html = renderWithStore(<ReconnectingNotice />, {
      match: { ...matchSlice.getInitialState(), isReconnecting: true },
    });

    expect(STRINGS.hud.duelReconnecting).toBe('Reconnecting...');
    expect(html).toContain('role="status"');
    expect(html).toContain(STRINGS.hud.duelReconnecting);
  });

  it('renders nothing while connected', () => {
    expect(renderWithStore(<ReconnectingNotice />)).toBe('');
  });
});
