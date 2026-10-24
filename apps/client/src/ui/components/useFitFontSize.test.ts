import { describe, expect, it } from 'vitest';

import { fitFontSize } from './useFitFontSize';

/** The panel title's fit on the Legend layout (OD-21e): Figma 96 px, floor 64, region 500 px. */
const LEGEND_TITLE = { designSize: 96, minSize: 64, maxWidth: 500 } as const;

describe('fitFontSize', () => {
  // Widths measured in Chrome at 96 px (WP-LEGEND audit r5, od21 baseline): Elarion 410 (the
  // Figma's 56:34), Veridan 422, Centurion 562, Juggernaut 607.
  it('keeps a Figma title at its design size: no fitted size', () => {
    expect(fitFontSize(410, 96, LEGEND_TITLE)).toBeNull();
    expect(fitFontSize(422, 96, LEGEND_TITLE)).toBeNull();
    expect(fitFontSize(500, 96, LEGEND_TITLE)).toBeNull();
  });

  it('shrinks a long title to whole px that fit the region', () => {
    expect(fitFontSize(562, 96, LEGEND_TITLE)).toBe(85);
    expect(fitFontSize(607, 96, LEGEND_TITLE)).toBe(79);
    expect(fitFontSize(501, 96, LEGEND_TITLE)).toBe(95);
    expect((562 * 85) / 96).toBeLessThanOrEqual(LEGEND_TITLE.maxWidth);
    expect((607 * 79) / 96).toBeLessThanOrEqual(LEGEND_TITLE.maxWidth);
  });

  it('never goes below the floor: a title too long even there overflows at 64 px', () => {
    expect(fitFontSize(900, 96, LEGEND_TITLE)).toBe(64);
    expect(fitFontSize(751, 96, LEGEND_TITLE)).toBe(LEGEND_TITLE.minSize);
  });

  // The hook measures at the computed size, which is the fitted size after a long title.
  it('measures from the rendered size, so the next title is fitted from its design width', () => {
    expect(fitFontSize((562 * 85) / 96, 85, LEGEND_TITLE)).toBe(85);
    expect(fitFontSize((607 * 85) / 96, 85, LEGEND_TITLE)).toBe(79);
    expect(fitFontSize((410 * 85) / 96, 85, LEGEND_TITLE)).toBeNull();
  });
});
