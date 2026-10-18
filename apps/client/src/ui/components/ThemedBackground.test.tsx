import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore, TEST_CONTENT } from '../testStore';
import { ThemedBackground } from './ThemedBackground';

const BACKDROP_URL = '/assets/test/test-backdrop.webp';

const loadedAssets = assetsSlice.reducer(
  undefined,
  assetsSlice.actions.groupUrlsChanged({
    group: 'selection',
    urls: { 'test-backdrop': BACKDROP_URL },
  }),
);

describe('ThemedBackground', () => {
  const set = TEST_CONTENT.backgroundSets[0];

  it('draws every layer through its view, hidden from assistive technology', () => {
    const html = renderWithStore(<ThemedBackground set={set} />, { assets: loadedAssets });
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('linear-gradient(90deg, var(--surface-0), var(--team-neutral-accent))');
    expect(html.match(/background-color:var\(--team-neutral-primary\)/g)).toHaveLength(3);
    expect(html).toContain(`url(&quot;${BACKDROP_URL}&quot;)`);
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });

  it('draws the layers in content order', () => {
    const html = renderWithStore(<ThemedBackground set={set} />, { assets: loadedAssets });
    const gradient = html.indexOf('linear-gradient');
    const particle = html.indexOf('background-color:var(--team-neutral-primary)');
    const image = html.indexOf(BACKDROP_URL);
    expect(gradient).toBeLessThan(particle);
    expect(particle).toBeLessThan(image);
  });

  it('places particles deterministically', () => {
    const render = () => renderWithStore(<ThemedBackground set={set} />);
    expect(render()).toBe(render());
  });

  it('renders a plain surface before content loads', () => {
    const html = renderWithStore(<ThemedBackground set={undefined} />);
    expect(html).toMatch(/^<div[^>]*aria-hidden="true"[^>]*><\/div>$/);
  });
});
