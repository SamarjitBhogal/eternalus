import { describe, expect, it } from 'vitest';

import { CHROME_PLATE_BOXES } from './GlowButton.constants';
import { chromePlateFor } from './useGlowButtonChrome';

const URL = '/assets/lock-in-chrome.webp';
const BOX = CHROME_PLATE_BOXES['lock-in-chrome'];

describe('chromePlateFor', () => {
  it('draws the plate in the Figma state: loaded, boxed, enabled, idle', () => {
    expect(BOX).toBeDefined();
    expect(chromePlateFor(URL, BOX, false, 'idle')).toEqual({ url: URL, box: BOX });
  });

  it.each(['hover', 'pressed'] as const)('draws the live chrome while %s', (interaction) => {
    expect(chromePlateFor(URL, BOX, false, interaction)).toBeNull();
  });

  it('draws the live chrome while disabled, before the plate loads and for an unboxed plate', () => {
    expect(chromePlateFor(URL, BOX, true, 'idle')).toBeNull();
    expect(chromePlateFor(null, BOX, false, 'idle')).toBeNull();
    expect(chromePlateFor(URL, undefined, false, 'idle')).toBeNull();
  });
});

describe('CHROME_PLATE_BOXES', () => {
  // WP-ASSETS placement table (frame px) minus each skin's root origin.
  it.each([
    ['select-class-chrome', 740, 858, 439, 163, 788, 908],
    ['lock-in-chrome', 754, 890, 411, 156, 803, 940],
  ] as const)(
    'places %s at its full render-bounds box',
    (id, x, y, width, height, rootX, rootY) => {
      expect(CHROME_PLATE_BOXES[id]).toEqual({ left: x - rootX, top: y - rootY, width, height });
    },
  );
});
