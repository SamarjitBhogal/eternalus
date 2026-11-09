import { describe, expect, it, vi } from 'vitest';

import type { AssetGroup, AssetUrls, SessionPhase } from '../bridge/events';
import { assetsSlice } from '../bridge/slices/assetsSlice';
import { firstAvailableSpecId, shippedCatalogue } from './content/__fixtures__/shippedCatalogue';
import type {
  SessionContext,
  SessionControllerDeps,
  SessionState,
} from './SessionController.types';
import { createDefaultSessionStates } from './session/defaultSessionStates';
import { REVEAL_COUNTDOWN_MS, SELECT_COUNTDOWN_MS } from './session/sessionTiming.constants';
import { flushMicrotasks, TEST_SELECTION_BOX, testSession } from './testSessionDeps';

const SELECTION_GROUPS: readonly AssetGroup[] = [
  'selection',
  'selection-primary',
  'selection-raster',
  'selection-primary-raster',
];

/** A session whose real match state also hands the test its context (to reach results). */
function sessionWithResults(overrides: Partial<SessionControllerDeps> = {}) {
  const captured: { context: SessionContext | null } = { context: null };
  const real = createDefaultSessionStates();
  const states = {
    ...real,
    match: {
      phase: 'match',
      enter: (context: SessionContext) => {
        real.match.enter?.(context);
        captured.context = context;
      },
      exit: (context: SessionContext) => {
        real.match.exit?.(context);
      },
    },
  } satisfies Record<SessionPhase, SessionState>;
  const session = testSession({ states, ...overrides });
  const emptied: AssetUrls[] = [];
  session.bus.on('asset-urls', (event) => {
    if (Object.keys(event.urls).length === 0) emptied.push(event);
  });
  const toMatch = async (): Promise<void> => {
    session.intent({ kind: 'start-match' });
    await session.resolveLoads();
    session.intent({
      kind: 'select-class',
      classId: 'magus',
      specId: firstAvailableSpecId('magus'),
    });
    session.intent({ kind: 'confirm-selection' });
    // DEC-60: LOCK IN holds the full select countdown; the reveal follows it.
    session.clock.advance(SELECT_COUNTDOWN_MS);
    session.clock.advance(REVEAL_COUNTDOWN_MS);
    await session.resolveLoads();
  };
  const toResults = (): void => {
    captured.context?.transition('results');
  };
  return { ...session, emptied, toMatch, toResults };
}

describe('SessionController asset groups', () => {
  it('publishes the credits once at boot, before the menu', async () => {
    const { controller, bus, resolveLoads } = testSession();
    const seen: string[] = [];
    const licences: string[] = [];
    bus.on('credits', ({ entries }) => {
      seen.push('credits');
      licences.push(...entries.map((entry) => entry.licenceId));
    });
    bus.on('session-phase', ({ phase }) => seen.push(phase));

    controller.start();
    await resolveLoads();

    expect(seen).toEqual(['boot', 'credits', 'menu']);
    expect(licences).toEqual(expect.arrayContaining(['ofl-cinzel', 'mit-phosphor']));
  });

  it('opens the menu with load-failed and one error when a boot load rejects (a bug)', async () => {
    const rejecting = {
      isLoaded: () => false,
      progress: (group: AssetGroup) => ({
        group,
        loaded: 0,
        total: 1,
        loadedBytes: 0,
        totalBytes: 9,
      }),
      load: () => Promise.reject(new Error('loader bug')),
      urls: () => ({}),
      boxes: () => ({}),
      release: () => undefined,
    };
    const { controller, store, logger, phases } = testSession({ resources: rejecting });

    controller.start();
    await flushMicrotasks();

    expect(phases).toEqual(['boot', 'menu']);
    expect(store.getState().session.reason).toBe('load-failed');
    expect(store.getState().loading).toMatchObject({ group: 'boot', status: 'failed' });
    expect(logger.records.map(({ severityText, scope }) => [severityText, scope])).toEqual([
      ['ERROR', 'client.session'],
    ]);
  });

  it('releases the loaded selection groups when the match starts, never the unloaded one', async () => {
    const session = sessionWithResults();
    session.controller.start();
    await session.resolveLoads();

    await session.toMatch();

    expect(session.controller.phase).toBe('match');
    expect(session.emptied.map(({ group }) => group)).toEqual(SELECTION_GROUPS);
  });

  it('reloads the selection groups for a rematch and shows their art again', async () => {
    const session = sessionWithResults();
    const load = vi.spyOn(session.resources, 'load');
    session.controller.start();
    await session.resolveLoads();
    await session.toMatch();
    session.toResults();

    session.intent({ kind: 'start-match' });
    await session.resolveLoads();

    const calls = load.mock.calls.map(([group]) => group);
    for (const group of SELECTION_GROUPS) {
      expect(calls.filter((called) => called === group)).toHaveLength(2);
    }
    expect(calls).not.toContain('selection-alternate');
    expect(session.controller.phase).toBe('character-select');
    expect(assetsSlice.selectors.selectAssetUrl(session.store.getState(), 'test-selection')).toBe(
      '/test/selection.webp',
    );
  });

  it("publishes a loaded group's draw boxes with its URLs, and empties both on release", async () => {
    const session = sessionWithResults();
    const published: AssetUrls[] = [];
    session.bus.on('asset-urls', (event) => published.push(event));
    session.controller.start();
    await session.resolveLoads();
    session.intent({ kind: 'start-match' });
    await session.resolveLoads();
    const atSelect = assetsSlice.selectors.selectAssetBox(
      session.store.getState(),
      'test-selection',
    );

    await session.toMatch();

    expect(atSelect).toEqual(TEST_SELECTION_BOX);
    expect(
      published.find(({ group, urls }) => group === 'selection' && 'test-selection' in urls),
    ).toMatchObject({ boxes: { 'test-selection': TEST_SELECTION_BOX } });
    expect(session.emptied.map(({ boxes }) => boxes)).toEqual(SELECTION_GROUPS.map(() => ({})));
    expect(
      assetsSlice.selectors.selectAssetBox(session.store.getState(), 'test-selection'),
    ).toBeNull();
  });

  it("empties the match group's URLs once from match through results to the menu", async () => {
    const session = sessionWithResults();
    session.controller.start();
    await session.resolveLoads();
    await session.toMatch();

    session.toResults();
    session.intent({ kind: 'navigate', route: 'home' });

    expect(session.controller.phase).toBe('menu');
    expect(session.emptied.filter(({ group }) => group === 'match')).toHaveLength(1);
  });

  it("marks the catalogue's colour set on the theme root while the session runs", () => {
    const figma = testSession();
    figma.controller.start();
    expect(figma.themeRoot.dataset.contrast).toBe('figma');
    figma.controller.destroy();
    expect(figma.themeRoot.dataset.contrast).toBeUndefined();

    const minimums = testSession({
      catalogue: { load: () => ({ ...shippedCatalogue().load(), contrastMode: 'minimums' }) },
    });
    minimums.controller.start();
    expect(minimums.themeRoot.dataset.contrast).toBe('minimums');
  });
});
