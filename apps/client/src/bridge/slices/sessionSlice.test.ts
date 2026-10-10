import { describe, expect, it } from 'vitest';

import { sessionSlice } from './sessionSlice';

const { phaseChanged, routeChanged, overlayChanged } = sessionSlice.actions;
const { selectMenuRoute, selectSessionPhase, selectSessionReason } = sessionSlice.selectors;

describe('sessionSlice', () => {
  it('starts at boot on the home route with no overlay', () => {
    expect(sessionSlice.getInitialState()).toEqual({
      phase: 'boot',
      reason: null,
      menuRoute: 'home',
      overlay: null,
    });
  });

  it('records phase, reason, route and overlay, and selects them from the root state', () => {
    let session = sessionSlice.reducer(
      undefined,
      phaseChanged({ phase: 'menu', reason: 'select-timeout' }),
    );
    session = sessionSlice.reducer(session, routeChanged('profile'));
    session = sessionSlice.reducer(session, overlayChanged('pause'));
    const root = { session };
    expect(selectSessionPhase(root)).toBe('menu');
    expect(selectSessionReason(root)).toBe('select-timeout');
    expect(selectMenuRoute(root)).toBe('profile');
    expect(session.overlay).toBe('pause');
  });
});
