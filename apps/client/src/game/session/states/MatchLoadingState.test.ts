import { describe, expect, it, vi } from 'vitest';

import type { AssetGroup } from '../../../bridge/events';
import { firstAvailableSpecId } from '../../content/__fixtures__/shippedCatalogue';
import { FakeSessionContext } from '../../FakeSessionContext';
import { flushMicrotasks, testResources, testSession } from '../../testSessionDeps';
import { REVEAL_COUNTDOWN_MS } from '../sessionTiming.constants';
import { MatchLoadingState } from './MatchLoadingState';

/** The Legend these tests pick for the sentinel class. */
const SENTINEL_LEGEND = firstAvailableSpecId('sentinel');

/** A fake context in match-loading, with the callbacks it gave its `match` group load. */
function entered() {
  const context = new FakeSessionContext();
  const state = new MatchLoadingState();
  state.enter(context);
  const [groups, onReady, onFailed] = context.calls.loadAssets[0] ?? [];
  return { context, state, groups, onReady, onFailed };
}

/** A real session walked to match-loading (its `match` group load still pending). */
async function atMatchLoading(overrides: Parameters<typeof testSession>[0] = {}) {
  const session = testSession(overrides);
  session.controller.start();
  await session.resolveLoads();
  session.intent({ kind: 'start-match' });
  await session.resolveLoads();
  session.intent({ kind: 'select-class', classId: 'sentinel', specId: SENTINEL_LEGEND });
  session.intent({ kind: 'confirm-selection' });
  session.clock.advance(REVEAL_COUNTDOWN_MS);
  return session;
}

describe('MatchLoadingState', () => {
  it('loads the match group, then prepares the world, then opens the match', () => {
    const { context, groups, onReady } = entered();
    expect(groups).toEqual(['match']);
    onReady?.();
    expect(context.order).toEqual(['loadAssets', 'prepareWorld', 'transition']);
    expect(context.calls.transition).toEqual([['match']]);
  });

  it('aborts the match when the world cannot be built', () => {
    const { context, onReady } = entered();
    const error = new Error('no stronghold');
    context.prepareWorldError = error;
    onReady?.();
    expect(context.calls.abortMatch).toEqual([[error]]);
    expect(context.calls.transition).toEqual([]);
  });

  it('cancels its load on exit', () => {
    const { context, state } = entered();
    state.exit();
    expect(context.cancelledLoads).toEqual([0]);
  });

  it('returns to the menu with match-failed and one error when the match load rejects', async () => {
    const { resources, loader } = testResources();
    const settle = async (): Promise<void> => {
      do {
        loader.resolveAll();
        await flushMicrotasks();
      } while (loader.pendingCount > 0);
    };
    const rejectingMatch = {
      isLoaded: (group: AssetGroup) => resources.isLoaded(group),
      progress: (group: AssetGroup) => resources.progress(group),
      urls: (group: AssetGroup) => resources.urls(group),
      boxes: (group: AssetGroup) => resources.boxes(group),
      release: (group: AssetGroup) => {
        resources.release(group);
      },
      load: vi.fn((group: AssetGroup, onProgress: Parameters<typeof resources.load>[1]) =>
        group === 'match'
          ? Promise.reject(new Error('loader bug'))
          : resources.load(group, onProgress),
      ),
    };
    const prepareWorld = vi.fn();
    const session = testSession({ resources: rejectingMatch, prepareWorld });
    session.controller.start();
    await settle();
    session.intent({ kind: 'start-match' });
    await settle();
    session.intent({ kind: 'select-class', classId: 'sentinel', specId: SENTINEL_LEGEND });
    session.intent({ kind: 'confirm-selection' });
    session.clock.advance(REVEAL_COUNTDOWN_MS);
    await settle();

    expect(session.phases.slice(-2)).toEqual(['match-loading', 'menu']);
    expect(session.store.getState().session.reason).toBe('match-failed');
    expect(session.logger.records.map(({ severityText, body }) => [severityText, body])).toEqual([
      ['ERROR', 'An asset group could not load.'],
    ]);
    expect(prepareWorld).not.toHaveBeenCalled();
  });

  it('returns to the menu with match-failed and one error when the world cannot be built', async () => {
    const session = await atMatchLoading({
      prepareWorld: () => {
        throw new Error('no stronghold');
      },
    });
    await session.resolveLoads();

    expect(session.phases.slice(-2)).toEqual(['match-loading', 'menu']);
    expect(session.store.getState().session.reason).toBe('match-failed');
    expect(session.logger.records.map(({ severityText, body }) => [severityText, body])).toEqual([
      ['ERROR', 'The match could not start.'],
    ]);
  });
});
