import { describe, expect, it } from 'vitest';

import { NO_DISPLAY_OVERRIDES } from './content/coreCatalogue';
import { type DeveloperFlags, readDeveloperFlags } from './developerFlags';

const CASES: readonly (readonly [string, DeveloperFlags])[] = [
  ['', { isDeveloper: false, displayOverrides: { effectsRenderer: null, uiEnhancements: null } }],
  [
    '?fx=css',
    { isDeveloper: false, displayOverrides: { effectsRenderer: null, uiEnhancements: null } },
  ],
  [
    '?dev=1',
    { isDeveloper: true, displayOverrides: { effectsRenderer: null, uiEnhancements: null } },
  ],
  [
    '?dev=1&fx=css',
    { isDeveloper: true, displayOverrides: { effectsRenderer: 'css', uiEnhancements: null } },
  ],
  [
    '?dev=1&fx=raster',
    {
      isDeveloper: true,
      displayOverrides: { effectsRenderer: 'figma-raster', uiEnhancements: null },
    },
  ],
  [
    '?dev=1&fx=bogus',
    { isDeveloper: true, displayOverrides: { effectsRenderer: null, uiEnhancements: null } },
  ],
  [
    '?dev=1&fx=constructor',
    { isDeveloper: true, displayOverrides: { effectsRenderer: null, uiEnhancements: null } },
  ],
  [
    '?dev=0&fx=css',
    { isDeveloper: false, displayOverrides: { effectsRenderer: null, uiEnhancements: null } },
  ],
  // ui-enhancements-plan §2 rule 1: `ui=<id>,<id>` overrides the list, for comparison only.
  [
    '?ui=countdown-urgency',
    { isDeveloper: false, displayOverrides: { effectsRenderer: null, uiEnhancements: null } },
  ],
  [
    '?dev=1&ui=countdown-urgency',
    {
      isDeveloper: true,
      displayOverrides: { effectsRenderer: null, uiEnhancements: ['countdown-urgency'] },
    },
  ],
  [
    '?dev=1&ui=',
    { isDeveloper: true, displayOverrides: { effectsRenderer: null, uiEnhancements: [] } },
  ],
  [
    '?dev=1&ui=bogus,countdown-urgency,countdown-urgency,constructor',
    {
      isDeveloper: true,
      displayOverrides: { effectsRenderer: null, uiEnhancements: ['countdown-urgency'] },
    },
  ],
  [
    '?dev=1&fx=css&ui=bogus',
    { isDeveloper: true, displayOverrides: { effectsRenderer: 'css', uiEnhancements: [] } },
  ],
];

describe('readDeveloperFlags', () => {
  it.each(CASES)('reads %j', (search, expected) => {
    expect(readDeveloperFlags(search)).toEqual(expected);
  });

  it('gives every non-developer page no display override', () => {
    const pages = CASES.map(([search]) => readDeveloperFlags(search)).filter(
      (flags) => !flags.isDeveloper,
    );
    expect(pages).toHaveLength(4);
    for (const flags of pages) expect(flags.displayOverrides).toBe(NO_DISPLAY_OVERRIDES);
    expect(NO_DISPLAY_OVERRIDES).toEqual({ effectsRenderer: null, uiEnhancements: null });
  });
});
