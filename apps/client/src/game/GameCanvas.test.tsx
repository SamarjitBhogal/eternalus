import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { store } from '../bridge/store';
import { GameCanvas } from './GameCanvas';

// Placeholder. Ignore.
describe('GameCanvas', () => {
  it('renders a canvas inside the store provider', () => {
    const html = renderToStaticMarkup(
      <Provider store={store}>
        <GameCanvas />
      </Provider>,
    );
    expect(html).toContain('<canvas');
  });
});
