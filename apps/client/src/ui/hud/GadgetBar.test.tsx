import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../../bridge/__fixtures__/hudFixtures';

import { renderWithStore } from '../testStore';
import { GadgetBar } from './GadgetBar';
import { withHudSetup, MOUSE_4, settingsWith, withBinding } from './hudTestSupport';

const glyphs = (html: string) => [...html.matchAll(/<kbd[^>]*>([^<]*)<\/kbd>/g)].map(([, l]) => l);

describe('GadgetBar', () => {
  it('has exactly the two gadget slots, each with its key glyph (CD-01)', () => {
    const html = renderWithStore(<GadgetBar />, withHudSetup(figmaHudState()));
    expect([...html.matchAll(/data-slot="([^"]+)"/g)].map(([, slot]) => slot)).toEqual([
      'gadget-1',
      'gadget-2',
    ]);
    expect(glyphs(html)).toEqual(['Z', 'C']);
  });

  it('shows "Mouse 4" once gadget-1 is bound to the fourth mouse button (13 §8)', () => {
    const html = renderWithStore(<GadgetBar />, {
      ...withHudSetup(figmaHudState()),
      settings: settingsWith(withBinding('gadget-1', MOUSE_4)),
    });
    expect(glyphs(html)).toEqual(['Mouse 4', 'C']);
  });

  it('shows Courage cooling down and the Sword ready (OD-9)', () => {
    const html = renderWithStore(<GadgetBar />, withHudSetup(figmaHudState()));
    expect([...html.matchAll(/data-look="([^"]+)"/g)].map(([, look]) => look)).toEqual([
      'cooldown',
      'ready',
    ]);
  });
});
