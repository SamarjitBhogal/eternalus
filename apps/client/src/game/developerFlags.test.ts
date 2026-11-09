import { describe, expect, it } from 'vitest';

import { NO_DISPLAY_OVERRIDES } from './content/coreCatalogue';
import { type DeveloperFlags, readDeveloperFlags } from './developerFlags';

const CASES: readonly (readonly [string, DeveloperFlags])[] = [
  ['', { isDeveloper: false, displayOverrides: { effectsRenderer: null } }],
  ['?fx=css', { isDeveloper: false, displayOverrides: { effectsRenderer: null } }],
  ['?dev=1', { isDeveloper: true, displayOverrides: { effectsRenderer: null } }],
  ['?dev=1&fx=css', { isDeveloper: true, displayOverrides: { effectsRenderer: 'css' } }],
  [
    '?dev=1&fx=raster',
    { isDeveloper: true, displayOverrides: { effectsRenderer: 'figma-raster' } },
  ],
  ['?dev=1&fx=bogus', { isDeveloper: true, displayOverrides: { effectsRenderer: null } }],
  ['?dev=1&fx=constructor', { isDeveloper: true, displayOverrides: { effectsRenderer: null } }],
  ['?dev=0&fx=css', { isDeveloper: false, displayOverrides: { effectsRenderer: null } }],
];

describe('readDeveloperFlags', () => {
  it.each(CASES)('reads %j', (search, expected) => {
    expect(readDeveloperFlags(search)).toEqual(expected);
  });

  it('gives every non-developer page no display override', () => {
    const pages = CASES.map(([search]) => readDeveloperFlags(search)).filter(
      (flags) => !flags.isDeveloper,
    );
    expect(pages).toHaveLength(3);
    for (const flags of pages) expect(flags.displayOverrides).toBe(NO_DISPLAY_OVERRIDES);
    expect(NO_DISPLAY_OVERRIDES).toEqual({ effectsRenderer: null });
  });
});
