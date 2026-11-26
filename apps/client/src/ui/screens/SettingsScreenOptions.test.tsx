import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
import { SettingsScreenOptions } from './SettingsScreenOptions';

function render(tab: 'gameplay' | 'audio' | 'video' | 'accessibility'): string {
  return renderWithStore(<SettingsScreenOptions tab={tab} />, {
    settings: {
      bindings: [],
      audio: { master: 0.8, music: 0.25, effects: 1 },
      video: { fullscreen: true, renderScale: 0.75 },
      accessibility: { reduceMotion: true, colourBlindMode: false },
      gameplay: { castMode: 'aim-then-click' },
    },
  });
}

describe('SettingsScreenOptions', () => {
  it('shows each volume as a labelled slider in percent', () => {
    const html = render('audio');

    expect(html).toMatch(/Master volume<\/span><input type="range"[^>]*value="80"/);
    expect(html).toMatch(/Music volume<\/span><input type="range"[^>]*value="25"/);
    expect(html).toContain('<output>100%</output>');
  });

  it('shows fullscreen and the render scale', () => {
    const html = render('video');

    expect(html).toMatch(/Fullscreen<\/span><input type="checkbox" checked=""/);
    expect(html).toMatch(/<option value="0.75" selected="">75%<\/option>/);
  });

  it('shows the cast mode as a labelled select with the saved mode chosen', () => {
    const html = render('gameplay');

    expect(html).toMatch(/Ability cast<\/span><select/);
    expect(html).toMatch(/<option value="quick">Quick cast[^<]*<\/option>/);
    expect(html).toMatch(
      /<option value="aim-then-click" selected="">Aim, then click[^<]*<\/option>/,
    );
  });

  it('shows the accessibility toggles', () => {
    const html = render('accessibility');

    expect(html).toMatch(/Reduce motion<\/span><input type="checkbox" checked=""/);
    expect(html).toMatch(/Colour-blind mode<\/span><input type="checkbox"\/>/);
  });
});
