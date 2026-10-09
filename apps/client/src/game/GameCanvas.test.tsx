import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { store } from '../bridge/store';
import { GameCanvas } from './GameCanvas';

// Checks the canvas appears on the page. Drawing runs in a browser effect, so it is not
// exercised here; it is tested in the engine/ and views/ tests instead.
describe('GameCanvas', () => {
  it('renders a canvas inside the store provider', () => {
    const html = renderToStaticMarkup(
      <Provider store={store}>
        <GameCanvas />
      </Provider>,
    );
    expect(html).toContain('<canvas');
    expect(html).toContain('World overview');
    expect(html).toContain('Light stronghold');
  });
});
