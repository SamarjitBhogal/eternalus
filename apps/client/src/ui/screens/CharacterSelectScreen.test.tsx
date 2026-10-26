import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import type { DisplayCatalogue } from '../../bridge/catalogue.types';
import type { PlayableTeam } from '../../bridge/domain.types';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import selectionStageStyles from '../components/SelectionStage.module.css';
import { accessibleNames, autofocusedClassIds, renderWithStore, TEST_CONTENT } from '../testStore';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { ClassSelectStep } from './ClassSelectStep';
import type { ScreenProps } from './screen.types';
import { rememberedClassId } from './useRememberedClassId';

/** As `App` mounts it: every screen gets the viewport, which this one must never render. */
const Screen: ComponentType<ScreenProps> = CharacterSelectScreen;

function render(
  classId: string | null,
  {
    team = 'light',
    content = TEST_CONTENT,
    countdownMs = 42_000,
  }: {
    readonly team?: PlayableTeam | null;
    readonly content?: DisplayCatalogue;
    readonly countdownMs?: number;
  } = {},
): string {
  return renderWithStore(<Screen viewport={<div data-viewport-sentinel="" />} />, {
    content,
    matchSetup: {
      ...matchSetupSlice.getInitialState(),
      playerTeam: team,
      selection: { classId, specId: null },
      countdownMs,
    },
  });
}

const vignettes = (html: string): string[] =>
  [...html.matchAll(/data-vignette="(\w+)"/g)].map(([, edge = '']) => edge);

/** TEST_CONTENT with the shipped catalogue's two selection sets (one per playable team). */
const SELECTION_SETS_CONTENT: DisplayCatalogue = {
  ...TEST_CONTENT,
  backgroundSets: [
    ...TEST_CONTENT.backgroundSets,
    { id: 'selection-light', team: 'light', layers: [] },
    { id: 'selection-dark', team: 'dark', layers: [] },
  ],
};

describe('CharacterSelectScreen', () => {
  it('shows the class step until a class is selected, with both vignettes (F1, 62:125)', () => {
    const html = render(null);

    expect(accessibleNames(html, '[role=radiogroup]')).toEqual(['Choose Your Class']);
    expect(html).not.toContain('Choose Your Legend');
    expect(vignettes(html)).toEqual(['top', 'bottom']);
  });

  it('shows the Legend step once a class is selected, with the bottom vignette only (58:271)', () => {
    const html = render('magus');

    expect(html).toContain('Magus &gt; Choose Your Legend');
    expect(html).not.toContain('Choose Your Class');
    expect(vignettes(html)).toEqual(['bottom']);
  });

  it("draws the class step in the catalogue's alternate layout (O5, 62:70)", () => {
    const html = render(null, { content: { ...TEST_CONTENT, classSelectLayout: 'alternate' } });

    expect(html).toContain('View Details');
    expect(html).not.toContain('role="radiogroup"');
  });

  it('never renders the game viewport', () => {
    for (const html of [render(null), render('magus')]) {
      expect(html).not.toContain('data-viewport-sentinel');
    }
  });

  it('draws the defs first, then the step, then the banner, countdown and team badge', () => {
    const html = render(null);
    const order = [
      '<svg class="',
      'role="radiogroup"',
      '<h1',
      'role="timer"',
      'You are on the Light team',
    ];

    expect(order.map((needle) => html.indexOf(needle)).every((at) => at !== -1)).toBe(true);
    expect(order.map((needle) => html.indexOf(needle))).toEqual(
      [...order.map((needle) => html.indexOf(needle))].sort((a, b) => a - b),
    );
    expect(html).toMatch(/<h1[^>]*>Legend Selection<\/h1>/);
    expect(html).toMatch(/role="timer"[^>]*>42</);
    expect(html).toContain(`class="${String(selectionStageStyles.artboard)}"`);
  });

  it('shows the countdown and team the session publishes', () => {
    expect(render(null, { countdownMs: 9_001 })).toMatch(/role="timer"[^>]*>10</);
    expect(render(null, { team: 'dark' })).toContain('You are on the Dark team');
    expect(render(null, { team: null })).not.toContain('You are on the');
  });

  it('shows the countdown from 60 down to 0 (CSUI 23)', () => {
    expect(render(null, { countdownMs: 60_000 })).toMatch(/role="timer"[^>]*>60</);
    expect(render(null, { countdownMs: 0 })).toMatch(/role="timer"[^>]*>0</);
  });

  it("draws the player team's background set, the neutral one before a team is known (CSUI 23)", () => {
    const background = (team: PlayableTeam | null): string | undefined =>
      /data-background="([^"]*)"/.exec(
        render(null, { team, content: SELECTION_SETS_CONTENT }),
      )?.[1];

    expect(background('light')).toBe('selection-light');
    expect(background('dark')).toBe('selection-dark');
    expect(background(null)).toBe('test-neutral');
  });

  it('focuses no card on first entry (the Figma shows no ring; Back is what refocuses)', () => {
    expect(render(null)).not.toContain('autofocus');
  });

  it('after Back, the class step it draws autofocuses the card picked before (CD-11)', () => {
    // Pick Magus (the Legend step), then Back (the session clears its pick): the shell's memory.
    const preferredClassId = rememberedClassId(rememberedClassId(null, 'magus'), null);
    const html = renderWithStore(<ClassSelectStep preferredClassId={preferredClassId} />, {
      content: TEST_CONTENT,
      matchSetup: { ...matchSetupSlice.getInitialState(), playerTeam: 'light' },
    });

    expect(preferredClassId).toBe('magus');
    expect(autofocusedClassIds(html)).toEqual(['magus']);
  });
});
