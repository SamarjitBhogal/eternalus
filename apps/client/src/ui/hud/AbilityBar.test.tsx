import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../../bridge/__fixtures__/hudFixtures';

import { renderWithStore } from '../testStore';
import { AbilityBar } from './AbilityBar';
import { withHudSetup, settingsWith, withBinding } from './hudTestSupport';

const glyphs = (html: string) => [...html.matchAll(/<kbd[^>]*>([^<]*)<\/kbd>/g)].map(([, l]) => l);

describe('AbilityBar', () => {
  it('shows the key glyphs in display order 4, 1, 2, 3', () => {
    expect(glyphs(renderWithStore(<AbilityBar />, withHudSetup(figmaHudState())))).toEqual([
      '4',
      '1',
      '2',
      '3',
    ]);
  });

  it('shows R and no 4 once the ultimate is rebound to R (FR-081)', () => {
    const html = renderWithStore(<AbilityBar />, {
      ...withHudSetup(figmaHudState()),
      settings: settingsWith(
        withBinding('ability-4', { device: 'keyboard', code: 'KeyR', label: 'R' }),
      ),
    });
    expect(glyphs(html)).toEqual(['R', '1', '2', '3']);
  });

  it('draws the charge bar, then the ultimate, the charge boxes and the abilities', () => {
    const html = renderWithStore(<AbilityBar />, withHudSetup(figmaHudState()));
    const order = [
      'aria-label="Ultimate charge"',
      'data-slot="ability-4"',
      'aria-label="Ultimate charges"',
      'data-slot="ability-1"',
    ];
    const at = order.map((marker) => html.indexOf(marker));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });
});
