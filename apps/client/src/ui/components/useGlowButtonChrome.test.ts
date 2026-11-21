import { describe, expect, it } from 'vitest';

import { chromePlateFor } from './useGlowButtonChrome';

const URL = '/assets/lock-in-chrome.webp';
/** Any draw box: the plate's own comes from its manifest entry (GlowButton.test.tsx). */
const BOX = { left: 1, top: 2, width: 3, height: 4 };

// Where a box lands is each skin's `.chrome` rule (GlowButton.styles.test.tsx).
describe('chromePlateFor', () => {
  it('draws the plate at its box in the Figma state: loaded, boxed, enabled, idle', () => {
    expect(chromePlateFor(URL, BOX, false, 'idle')).toEqual({ url: URL, box: BOX });
  });

  it.each(['hover', 'pressed'] as const)('draws the live chrome while %s', (interaction) => {
    expect(chromePlateFor(URL, BOX, false, interaction)).toBeNull();
  });

  it('draws the live chrome while disabled, before the plate loads and for an unboxed plate', () => {
    expect(chromePlateFor(URL, BOX, true, 'idle')).toBeNull();
    expect(chromePlateFor(null, BOX, false, 'idle')).toBeNull();
    expect(chromePlateFor(URL, null, false, 'idle')).toBeNull();
  });
});
