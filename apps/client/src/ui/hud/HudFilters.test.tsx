import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import levelBadgeCss from './LevelBadge.module.css?raw';
import { HudFilters } from './HudFilters';
import { HUD_FILTER_LEVEL_NUMBER } from './HudFilters.constants';

const html = renderToStaticMarkup(<HudFilters />);

describe('HudFilters', () => {
  it('holds exactly the level-number filter, hidden and in sRGB', () => {
    expect([...html.matchAll(/<filter id="([^"]+)"/g)].map(([, id]) => id)).toEqual([
      HUD_FILTER_LEVEL_NUMBER,
    ]);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('color-interpolation-filters="sRGB"');
    expect(levelBadgeCss).toContain(`url('#${HUD_FILTER_LEVEL_NUMBER}')`);
  });

  it('scales its blurs with the text box: σ 3.5 and 5.25 px of the 72 × 63 box', () => {
    expect(html).toContain(`stdDeviation="${String(3.5 / 72)} ${String(3.5 / 63)}"`);
    expect(html).toContain(`stdDeviation="${String(5.25 / 72)} ${String(5.25 / 63)}"`);
    expect(html).toContain('primitiveUnits="objectBoundingBox"');
  });

  it("keeps Figma's grain (seed 8432, 13 of 100 bins) with no hardAlpha matrix and no colour literal", () => {
    expect(html).toContain('seed="8432"');
    const table = /tableValues="([^"]+)"/.exec(html)?.[1]?.split(' ') ?? [];
    expect(table).toHaveLength(100);
    expect(table.indexOf('1')).toBe(18);
    expect(table.filter((bin) => bin === '1')).toHaveLength(13);
    expect(html).not.toMatch(/0 0 0 127 0|#[0-9a-f]{3,8}\b|rgba?\(/i);
  });
});
