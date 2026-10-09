import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { TEST_CONTENT } from '../testStore';
import { ThemedBackground } from './ThemedBackground';

describe('ThemedBackground', () => {
  const set = TEST_CONTENT.backgroundSets[0];

  it('draws every layer from token references, hidden from assistive technology', () => {
    const html = renderToStaticMarkup(<ThemedBackground set={set} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('linear-gradient(90deg, var(--surface-0), var(--team-neutral-accent))');
    expect(html.match(/background-color:var\(--team-neutral-primary\)/g)).toHaveLength(3);
    expect(html).toContain('url(&quot;/backgrounds/test.png&quot;)');
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });

  it('places particles deterministically', () => {
    const render = () => renderToStaticMarkup(<ThemedBackground set={set} />);
    expect(render()).toBe(render());
  });

  it('renders a plain surface before content loads', () => {
    const html = renderToStaticMarkup(<ThemedBackground set={undefined} />);
    expect(html).toMatch(/^<div[^>]*aria-hidden="true"[^>]*><\/div>$/);
  });
});
