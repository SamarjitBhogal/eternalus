import { describe, expect, it, vi } from 'vitest';

import type { MatchCrash } from './Match.types';
import { MemoryReportWriter } from '../data/logging/MemoryReportWriter';
import { firstAvailableSpecId } from './content/__fixtures__/shippedCatalogue';
import { FakeRunningMatch } from './FakeRunningMatch';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import type { SessionController } from './SessionController';
import type { MatchFactory } from './SessionController.types';
import { REVEAL_COUNTDOWN_MS, SELECT_COUNTDOWN_MS } from './session/sessionTiming.constants';
import { flushMicrotasks, testReporter, testSession } from './testSessionDeps';

const SCREEN_CRASH = {
  kind: 'report-screen-crash',
  screen: 'match',
  message: 'render failed',
  stack: 'at Screen',
  componentStack: 'in Screen',
} as const;

/** A session whose reports go to `writer`, whose match is a `FakeRunningMatch` and that records every `onCrash`. */
function setUp(writer = new MemoryReportWriter()) {
  const matches: FakeRunningMatch[] = [];
  const crashes: ((crash: MatchCrash) => void)[] = [];
  const createMatch: MatchFactory = (request) => {
    crashes.push(request.onCrash);
    const match = new FakeRunningMatch();
    matches.push(match);
    return match;
  };
  // `session` is read only when a crash is reported, long after it was built.
  const reporter = testReporter(writer, () => session.controller.matchEvidence());
  const session = testSession({ createMatch, reporter });
  const controller: SessionController = session.controller;
  const toCharacterSelect = async (): Promise<void> => {
    controller.start();
    await session.resolveLoads();
    session.intent({ kind: 'start-match' });
    await session.resolveLoads();
  };
  const toMatch = async (): Promise<void> => {
    await toCharacterSelect();
    session.intent({
      kind: 'select-class',
      classId: 'magus',
      specId: firstAvailableSpecId('magus'),
    });
    session.intent({ kind: 'confirm-selection' });
    session.clock.advance(SELECT_COUNTDOWN_MS);
    session.clock.advance(REVEAL_COUNTDOWN_MS);
    await session.resolveLoads();
    controller.attachViewport({
      canvas: new FakeViewportCanvas(),
      chrome: {
        onInteriorChanged: () => undefined,
        onExplorerChanged: () => undefined,
        setLeaveInterior: () => undefined,
        setOverview: () => undefined,
      },
      isExplorerShown: false,
    });
  };
  const toPreLaunch = async (): Promise<void> => {
    await toCharacterSelect();
    session.intent({
      kind: 'select-class',
      classId: 'magus',
      specId: firstAvailableSpecId('magus'),
    });
    session.intent({ kind: 'confirm-selection' });
    session.clock.advance(SELECT_COUNTDOWN_MS);
  };
  const popup = () => session.store.getState().session.crashReport;
  const firstMatch = (): FakeRunningMatch => {
    const [match] = matches;
    if (match === undefined) throw new Error('no match was built');
    return match;
  };
  return {
    ...session,
    writer,
    matches,
    firstMatch,
    crashes,
    toCharacterSelect,
    toPreLaunch,
    toMatch,
    popup,
  };
}

describe('SessionController crash reports', () => {
  it('reports a game-loop crash once, with the match evidence, and opens the popup', async () => {
    const session = setUp();
    await session.toMatch();
    const error = new Error('step failed');

    session.crashes[0]?.({ error, tick: 42 });
    session.crashes[0]?.({ error, tick: 43 });
    await flushMicrotasks();

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('match-crashed');
    expect(session.matches[0]?.destroyCount).toBe(1);
    expect(session.writer.saved).toHaveLength(1);
    expect(session.writer.saved[0]).toMatchObject({
      kind: 'crash',
      error: { message: 'step failed', stack: error.stack, source: 'game-loop' },
      match: { replay: { checkpoints: [{ tick: 0 }] } },
    });
    expect(session.popup()?.stage).toBe('asking');
  });

  it('ends a match whose screen crashed: the report holds the match, read before it is dropped', async () => {
    const session = setUp();
    await session.toMatch();

    const evidence = vi.spyOn(session.firstMatch(), 'evidence');

    session.intent(SCREEN_CRASH);
    await flushMicrotasks();

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('match-crashed');
    expect(session.matches[0]?.destroyCount).toBe(1);
    expect(session.writer.saved).toHaveLength(1);
    expect(session.writer.saved[0]).toMatchObject({
      error: {
        message: 'render failed',
        stack: 'at Screen\n\nComponent stack:in Screen',
        source: 'screen:match',
      },
      match: { seed: 7, tick: 90 },
    });
    expect(session.popup()).toMatchObject({ stage: 'asking', cause: 'match' });
    expect(session.logger.records).toHaveLength(1);
    expect(session.logger.records[0]).toMatchObject({
      severityText: 'FATAL',
      scope: 'client.session',
      tick: 90,
      attributes: { componentStack: 'in Screen' },
    });
    // Only the report builds the evidence; reading the tick does not (N1).
    expect(evidence).toHaveBeenCalledTimes(1);
  });

  it('still reports a screen crash in a match when the tick cannot be read, with tick null', async () => {
    const session = setUp();
    await session.toMatch();
    vi.spyOn(session.firstMatch(), 'currentTick').mockImplementation(() => {
      throw new Error('tick unreadable');
    });

    session.intent(SCREEN_CRASH);
    await flushMicrotasks();

    expect(session.controller.phase).toBe('menu');
    expect(session.writer.saved).toHaveLength(1);
    expect(session.logger.records[0]?.tick).toBeNull();
  });

  it('returns to the menu with screen-crashed when a screen outside a match crashed', async () => {
    const session = setUp();
    await session.toCharacterSelect();
    const { seed } = session.store.getState().matchSetup;

    session.intent({ ...SCREEN_CRASH, screen: 'character-select' });
    await flushMicrotasks();

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('screen-crashed');
    expect(session.writer.saved).toHaveLength(1);
    expect(session.writer.saved[0]).toMatchObject({
      error: { source: 'screen:character-select' },
      match: null,
    });
    expect(session.popup()).toMatchObject({ stage: 'asking', cause: 'screen' });
    expect(session.logger.records[0]).toMatchObject({
      severityText: 'FATAL',
      body: 'The screen stopped because of an error.',
      tick: null,
      attributes: {
        error: 'character-select: render failed',
        stack: 'at Screen\n\nComponent stack:in Screen',
        componentStack: 'in Screen',
        seed,
      },
    });
  });

  it('returns to the menu with screen-crashed when the pre-launch reveal crashed (DEC-141)', async () => {
    const session = setUp();
    await session.toPreLaunch();

    session.intent({ ...SCREEN_CRASH, screen: 'pre-launch' });

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('screen-crashed');
    expect(session.popup()).toMatchObject({ stage: 'asking', cause: 'screen' });
  });

  it('gives the reveal no way out except a crash: no player intent leaves pre-launch', async () => {
    const session = setUp();
    await session.toPreLaunch();

    session.intent({ kind: 'start-match' });
    session.intent({ kind: 'cancel-match' });
    session.intent({ kind: 'leave-match' });
    session.intent({ kind: 'navigate', route: 'home' });
    session.intent({ kind: 'confirm-selection' });

    expect(session.controller.phase).toBe('pre-launch');
  });

  it('shows screen-crashed again and goes back home when a menu screen crashed', async () => {
    const session = setUp();
    session.controller.start();
    await session.resolveLoads();
    session.intent({ kind: 'navigate', route: 'settings' });

    session.intent({ ...SCREEN_CRASH, screen: 'menu.settings' });

    const { phase, reason, menuRoute } = session.store.getState().session;
    expect([phase, reason, menuRoute]).toEqual(['menu', 'screen-crashed', 'home']);
    expect(session.popup()?.stage).toBe('asking');
  });

  it('saves the note into the saved report and shows where it is', async () => {
    const session = setUp();
    await session.toMatch();
    session.crashes[0]?.({ error: new Error('x'), tick: 1 });

    session.intent({ kind: 'save-crash-note', note: 'I pressed R' });
    await flushMicrotasks();

    expect(session.writer.saved[0]?.note).toBe('I pressed R');
    expect(session.popup()).toMatchObject({ stage: 'saved', file: 'memory/memory-1.json' });
  });

  it('puts the note into the copy text when the report could not be saved', async () => {
    const writer = new MemoryReportWriter();
    writer.save = () => Promise.reject(new Error('no server'));
    const session = setUp(writer);
    await session.toMatch();
    session.crashes[0]?.({ error: new Error('x'), tick: 1 });
    await flushMicrotasks();

    session.intent({ kind: 'save-crash-note', note: 'I pressed R' });
    await flushMicrotasks();

    const popup = session.popup();
    expect(popup?.stage).toBe('copy');
    expect(JSON.parse(popup?.stage === 'copy' ? popup.copyText : '{}')).toMatchObject({
      note: 'I pressed R',
      error: { message: 'x' },
    });
  });

  it('closes the popup on dismiss-crash-report', async () => {
    const session = setUp();
    await session.toMatch();
    session.crashes[0]?.({ error: new Error('x'), tick: 1 });

    session.intent({ kind: 'dismiss-crash-report' });

    expect(session.popup()).toBeNull();
    expect(session.controller.phase).toBe('menu');
  });

  it('ignores a screen crash after the session was destroyed', async () => {
    const session = setUp();
    await session.toCharacterSelect();
    session.controller.destroy();

    session.intent({ ...SCREEN_CRASH, screen: 'character-select' });

    expect(session.writer.saved).toHaveLength(0);
  });
});
