import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Panel } from './Panel';

describe('Panel', () => {
  it('is a section labelled by its heading', () => {
    const html = renderToStaticMarkup(
      <Panel title="Settings">
        <p>body</p>
      </Panel>,
    );
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeDefined();
    expect(html).toContain(`<h2 id="${String(labelledBy)}"`);
    expect(html).toContain('>Settings</h2>');
    expect(html).toContain('<p>body</p>');
  });
});
