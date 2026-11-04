import { describe, expect, it } from 'vitest';

import { sessionSlice } from './slices/sessionSlice';
import { createAppStore, store } from './store';

describe('store', () => {
  it('registers the eight contract slices', () => {
    expect(Object.keys(store.getState()).sort()).toEqual(
      ['assets', 'content', 'hud', 'loading', 'match', 'matchSetup', 'session', 'settings'].sort(),
    );
  });

  it('builds isolated stores from a preloaded fixture', () => {
    const fixture = createAppStore({
      session: { ...sessionSlice.getInitialState(), phase: 'results' },
    });
    expect(fixture.getState().session.phase).toBe('results');
    expect(store.getState().session.phase).toBe('boot');
  });
});
