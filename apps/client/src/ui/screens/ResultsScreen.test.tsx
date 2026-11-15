import { describe, expect, it } from 'vitest';

import { matchResultFixture } from '../../bridge/__fixtures__/matchResultFixtures';
import type { MatchEnding, PlayableTeam } from '../../bridge/domain.types';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { matchSlice } from '../../bridge/slices/matchSlice';
import selectionStageStyles from '../components/SelectionStage.module.css';
import { STRINGS } from '../strings';
import { accessibleNames, buttonNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { ResultsScreen } from './ResultsScreen';

/** Lines and names no shipped content uses, so a line naming them can only come from content. */
const CONTENT = {
  ...TEST_CONTENT,
  verdictLines: {
    'objective-lost': {
      victory: 'Their {name} is down.',
      defeat: 'Our {name} is down.',
      draw: 'Each {name} is down.',
    },
  },
  sovereignNames: { light: 'Queen', dark: 'Tyrant' },
};

/** A local match's setup: its allies are what a rematch repeats. */
const LOCAL_SETUP = {
  ...matchSetupSlice.getInitialState(),
  mode: 'local',
  playerTeam: 'light',
  allies: [
    {
      legendId: 'light-1',
      displayName: 'Tester',
      classId: 'sentinel',
      specId: null,
      isBot: false,
      isPlayer: true,
      isRover: true,
      team: 'light',
    },
  ],
} as const;

/** The screen after a match `winner` won (`null`: a draw; `'none'`: no result) for light. */
const render = (winner: PlayableTeam | null | 'none', resultsMs = 30_000): string =>
  renderWithStore(<ResultsScreen />, {
    content: CONTENT,
    match: {
      ...matchSlice.getInitialState(),
      result: winner === 'none' ? null : matchResultFixture({ winner }),
      durationSeconds: winner === 'none' ? null : 872,
    },
    matchSetup: { ...LOCAL_SETUP, countdownsMs: { select: 0, reveal: 0, results: resultsMs } },
  });

/**
 * The screen after an online Duel played for dark that the server ended: its setup has no rosters
 * (the session publishes it when the first snapshot arrives).
 */
const renderDuel = (duel: MatchEnding): string =>
  renderWithStore(<ResultsScreen />, {
    content: CONTENT,
    match: { ...matchSlice.getInitialState(), duel },
    matchSetup: { ...matchSetupSlice.getInitialState(), mode: 'duel', playerTeam: 'dark' },
  });

const heading = (html: string): string | undefined => /<h1[^>]*>([^<]*)<\/h1>/.exec(html)?.[1];

describe('ResultsScreen', () => {
  it.each([
    ['light', 'VICTORY', 'Their Tyrant is down.'],
    ['dark', 'DEFEAT', 'Our Queen is down.'],
    [null, 'DRAW', 'Each Queen is down.'],
  ] as const)(
    'shows the verdict for winner %s as the title, then its line from content',
    (winner, title, line) => {
      const html = render(winner);
      expect(heading(html)).toBe(title);
      expect(html).toMatch(new RegExp(`<p [^>]*role="status"[^>]*>${line}</p>`));
    },
  );

  it("shows the match's length and the seconds left, as a named timer", () => {
    const html = render('light', 29_001);
    expect(html).toContain(STRINGS.results.duration('14:32'));
    expect(accessibleNames(html, '[role=timer]')).toEqual([STRINGS.results.countdownLabel]);
    expect(html).toMatch(/role="timer"[^>]*>30</);
  });

  it('offers Continue first and focused, then a rematch and the main menu', () => {
    const html = render('light');
    expect(buttonNames(html)).toEqual([
      STRINGS.results.continue,
      STRINGS.results.playAgain,
      STRINGS.results.mainMenu,
    ]);
    expect(html).toMatch(/<button [^>]*autofocus=""[^>]*>Continue</);
  });

  it('says so, and names no verdict, without a result', () => {
    const html = render('none');
    expect(heading(html)).toBe(STRINGS.results.title);
    expect(html).toContain(STRINGS.results.statuses['no-result']);
    expect(html).not.toContain('Match length');
  });

  it('draws on the selection artboard with both vignettes and the team badge', () => {
    const html = render('light');
    expect(html).toContain(`class="${String(selectionStageStyles.artboard)}"`);
    expect([...html.matchAll(/data-vignette="(\w+)"/g)].map(([, edge]) => edge)).toEqual([
      'top',
      'bottom',
    ]);
    expect(html).toContain(STRINGS.characterSelect.teamBadge(TEST_CONTENT.teamNames.light));
  });

  it.each([
    ['dark', 'VICTORY'],
    ['light', 'DEFEAT'],
    [null, 'DRAW'],
  ] as const)(
    "shows a finished Duel's verdict for winner %s from the player's own team",
    (winner, title) => {
      expect(heading(renderDuel({ winner, reason: 'finished' }))).toBe(title);
    },
  );

  it.each([null, 'dark'] as const)(
    'names the opponent leaving, and no verdict, after a Duel the other player left (winner %s)',
    (winner) => {
      const html = renderDuel({ winner, reason: 'opponent-left' });
      expect(heading(html)).toBe(STRINGS.results.title);
      expect(html).toMatch(
        new RegExp(`<p [^>]*role="status"[^>]*>${STRINGS.results.statuses['opponent-left']}</p>`),
      );
    },
  );

  it('offers no rematch after an online Duel, whose setup is not repeatable', () => {
    const html = renderDuel({ winner: 'dark', reason: 'finished' });
    expect(buttonNames(html)).toEqual([STRINGS.results.continue, STRINGS.results.mainMenu]);
  });
});
