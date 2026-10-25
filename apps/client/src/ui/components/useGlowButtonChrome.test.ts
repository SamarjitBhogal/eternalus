import { describe, expect, it } from 'vitest';

import { BOXED_CHROME_PLATES } from './GlowButton.constants';
import { chromePlateFor } from './useGlowButtonChrome';

const URL = '/assets/lock-in-chrome.webp';
const IS_BOXED = BOXED_CHROME_PLATES['lock-in'] === 'lock-in-chrome';

// The boxes themselves are each skin's `.chrome` rule (GlowButton.styles.test.tsx).
describe('chromePlateFor', () => {
  it('draws the plate in the Figma state: loaded, boxed, enabled, idle', () => {
    expect(IS_BOXED).toBe(true);
    expect(chromePlateFor(URL, IS_BOXED, false, 'idle')).toBe(URL);
  });

  it.each(['hover', 'pressed'] as const)('draws the live chrome while %s', (interaction) => {
    expect(chromePlateFor(URL, IS_BOXED, false, interaction)).toBeNull();
  });

  it('draws the live chrome while disabled, before the plate loads and for an unboxed plate', () => {
    expect(chromePlateFor(URL, IS_BOXED, true, 'idle')).toBeNull();
    expect(chromePlateFor(null, IS_BOXED, false, 'idle')).toBeNull();
    expect(chromePlateFor(URL, false, false, 'idle')).toBeNull();
  });
});
