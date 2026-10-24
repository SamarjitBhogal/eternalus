import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../../bridge/hudFixtures';

import type { Overlay } from '../../bridge/events';
import type { RootState } from '../../bridge/store';
import { FIGMA_MATCH_SETUP, withHudSetup, HUD_BINDINGS, settingsWith } from '../hud/hudTestSupport';
import { accessibleNames, renderWithStore, sessionAt } from '../testStore';
import { MatchScreen } from './MatchScreen';

const VIEWPORT = <canvas data-testid="viewport" />;

/** The match screen in the `match` phase with `overlay` open over `state`. */
function render(state: Partial<RootState>, overlay: Overlay | null = null): string {
  return renderWithStore(<MatchScreen viewport={VIEWPORT} />, {
    ...state,
    session: { ...sessionAt('match'), overlay },
  });
}

/** What a live match has before its first publish: the setup and the keys, no HUD values. */
const LIVE_START: Partial<RootState> = {
  matchSetup: FIGMA_MATCH_SETUP,
  settings: settingsWith(HUD_BINDINGS),
};

const ROLES = ['[role=meter]', '[role=img]', '[role=group]', '[role=timer]', '[role=dialog]'];

/** Every meter's `[now, min, max]`. */
const meterValues = (html: string) =>
  [...html.matchAll(/<[^>]*role="meter"[^>]*>/g)].map(([tag]) =>
    ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'].map((name) => {
      const value = new RegExp(`${name}="([^"]+)"`).exec(tag)?.[1];
      return value === undefined ? Number.NaN : Number(value);
    }),
  );

describe('MatchScreen', () => {
  it('renders the viewport under a HUD of nine regions', () => {
    const html = render(withHudSetup(figmaHudState()));
    expect(html).toContain('<canvas data-testid="viewport"></canvas>');
    expect([...html.matchAll(/data-hud-region="([^"]+)"/g)].map(([, name]) => name)).toEqual([
      'abilities',
      'weapon',
      'gadgets',
      'resources',
      'level',
      'structures-objectives',
      'crystal',
      'clock',
      'minimap',
    ]);
    expect(accessibleNames(html, 'section')).toEqual(['Match HUD']);
  });

  it('shows the Figma values 1850, 4700, 42 and 14:32', () => {
    const html = render(withHudSetup(figmaHudState()));
    for (const value of ['>1850<', '>4700<', '>42<', '>14:32<']) {
      expect(html).toContain(value);
    }
  });

  it('shows none of them, and dashes, before the first publish', () => {
    const html = render(LIVE_START);
    for (const value of ['1850', '4700', '>42<', '14:32']) {
      expect(html).not.toContain(value);
    }
    expect(html.match(/>—</g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('names every meter, image, group, timer and dialog (a11y walk)', () => {
    const figma = render(withHudSetup(figmaHudState()), 'pause');
    const live = render(LIVE_START, 'pause');
    const unnamed = (html: string) =>
      ROLES.flatMap((role) =>
        accessibleNames(html, role)
          .filter((name) => name.trim() === '')
          .map(() => role),
      );
    expect(unnamed(figma)).toEqual([]);
    expect(unnamed(live)).toEqual([]);
    const isPresent = (html: string) => ROLES.map((role) => accessibleNames(html, role).length > 0);
    // The Figma state has every value (no image); before any data every meter is an image.
    expect(isPresent(figma)).toEqual([true, false, true, true, true]);
    expect(isPresent(live)).toEqual([false, true, true, true, true]);
  });

  it('gives every meter a value within its range, on the Figma state and before any data', () => {
    for (const html of [render(withHudSetup(figmaHudState())), render(LIVE_START)]) {
      for (const [now = Number.NaN, min = Number.NaN, max = Number.NaN] of meterValues(html)) {
        expect(min).toBeLessThanOrEqual(now);
        expect(now).toBeLessThanOrEqual(max);
      }
    }
    expect(meterValues(render(withHudSetup(figmaHudState()))).length).toBeGreaterThan(0);
  });

  it('opens the pause dialog beside an inert viewport and HUD (I-72)', () => {
    const html = render(withHudSetup(figmaHudState()), 'pause');
    expect(html).toContain('Leave match');
    expect(html).toMatch(/<div class="[^"]*" inert=""><canvas/);
    expect(html).toMatch(/<section class="[^"]*" aria-label="Match HUD" inert="">/);
    expect(html.indexOf('role="dialog"')).toBeGreaterThan(html.lastIndexOf('</section>'));
  });

  it('is not inert and has no dialog while no overlay is open', () => {
    const html = render(withHudSetup(figmaHudState()));
    expect(html).not.toContain('inert');
    expect(html).not.toContain('role="dialog"');
  });
});
