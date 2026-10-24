import { describe, expect, it } from 'vitest';

import { MINI_MAP_RING } from '../../bridge/minimapRing';
import { renderWithStore } from '../testStore';
import { cssRule } from './hudTestSupport';
import { MinimapPanel } from './MinimapPanel';
import css from './MinimapPanel.module.css?raw';

const designPx = (declarations: string, property: string): number | undefined => {
  const match = new RegExp(`${property}: calc\\((-?[\\d.]+) \\* var\\(--hud-u\\)\\)`).exec(
    declarations,
  );
  return match === null ? undefined : Number(match[1]);
};

describe('MinimapPanel', () => {
  it('draws the ring frame raster, hidden from assistive technology', () => {
    const html = renderWithStore(<MinimapPanel />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('src="/assets/test/minimap-frame.webp"');
  });

  it('states the same ring box as MINI_MAP_RING, which the canvas minimap draws in', () => {
    const panel = cssRule(css, '.panel');
    expect({
      right: designPx(panel, 'right'),
      top: designPx(panel, 'top'),
      width: designPx(panel, 'width'),
      height: designPx(panel, 'height'),
    }).toEqual(MINI_MAP_RING);
  });
});
