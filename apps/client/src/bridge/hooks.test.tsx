import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { shallowEqual, useAppSelector } from './hooks';
import { sessionSlice } from './slices/sessionSlice';
import { createAppStore } from './store';

function Phase(): ReactElement {
  return <span>{useAppSelector((state) => state.session.phase)}</span>;
}

describe('useAppSelector', () => {
  it('reads the root state of the surrounding store', () => {
    const store = createAppStore({
      session: { ...sessionSlice.getInitialState(), phase: 'match' },
    });
    expect(
      renderToStaticMarkup(
        <Provider store={store}>
          <Phase />
        </Provider>,
      ),
    ).toBe('<span>match</span>');
  });
});

describe('shallowEqual', () => {
  it('compares the fields of fresh objects, not their identity', () => {
    expect(shallowEqual({ health: 5, isReady: true }, { health: 5, isReady: true })).toBe(true);
    expect(shallowEqual({ health: 5 }, { health: 6 })).toBe(false);
    expect(shallowEqual({ nested: { health: 5 } }, { nested: { health: 5 } })).toBe(false);
  });
});
