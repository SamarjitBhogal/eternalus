import { describe, expect, it, vi } from 'vitest';

import type { Overlay } from '../../../bridge/events';
import { FakeViewportCanvas } from '../../FakeViewportCanvas';
import type { MatchViewport } from '../../MatchViewport.types';
import type { RunningMatch } from '../../SessionController.types';
import { spyContext } from '../../testSessionDeps';
import { SELECTION_ASSET_GROUPS } from '../selectionAssetGroups';
import { MatchState } from './MatchState';

const VIEWPORT: MatchViewport = {
  canvas: new FakeViewportCanvas(),
  chrome: { onInteriorChanged: vi.fn(), setLeaveInterior: vi.fn(), setOverview: vi.fn() },
  isExplorerShown: false,
};

/** A match state entered on a spy context whose factory hands out recorded handles. */
function setUp() {
  const context = spyContext();
  const handles: { destroy: ReturnType<typeof vi.fn>; setPaused: ReturnType<typeof vi.fn> }[] = [];
  context.createMatch.mockImplementation((): RunningMatch => {
    const handle = { destroy: vi.fn(), setPaused: vi.fn() };
    handles.push(handle);
    return handle;
  });
  const overlays: (Overlay | null)[] = [];
  context.bus.on('overlay', ({ overlay }) => overlays.push(overlay));
  const state = new MatchState();
  state.enter(context);
  return { context, handles, overlays, state };
}

describe('MatchState', () => {
  it('releases every selection group once, in order, on enter', () => {
    const { context } = setUp();
    expect(context.releaseAssets.mock.calls.map(([group]) => group)).toEqual(
      SELECTION_ASSET_GROUPS,
    );
    expect(context.createMatch).not.toHaveBeenCalled();
  });

  it('builds the match on attach and destroys it on detach', () => {
    const { context, handles, state } = setUp();
    const detach = state.attachViewport(VIEWPORT, context);
    expect(context.createMatch).toHaveBeenCalledWith(VIEWPORT);
    detach();
    expect(handles[0]?.destroy).toHaveBeenCalledTimes(1);
  });

  it('replaces the match on a second attach, and a stale detach never ends the newer one', () => {
    const { context, handles, state } = setUp();
    const detachFirst = state.attachViewport(VIEWPORT, context);
    state.attachViewport(VIEWPORT, context);
    expect(handles[0]?.destroy).toHaveBeenCalledTimes(1);
    detachFirst();
    expect(handles[1]?.destroy).not.toHaveBeenCalled();
  });

  it('aborts the match with the error when it cannot be built; the detach does nothing', () => {
    const { context, state } = setUp();
    const error = new Error('no 2D canvas');
    context.createMatch.mockImplementation(() => {
      throw error;
    });
    const detach = state.attachViewport(VIEWPORT, context);
    expect(context.abortMatch).toHaveBeenCalledWith(error);
    expect(() => {
      detach();
    }).not.toThrow();
  });

  it('destroys the match, drops the world and closes any overlay on exit', () => {
    const { context, handles, overlays, state } = setUp();
    state.attachViewport(VIEWPORT, context);
    state.exit(context);
    expect(handles[0]?.destroy).toHaveBeenCalledTimes(1);
    expect(context.dropWorld).toHaveBeenCalledTimes(1);
    expect(overlays).toEqual([null]);
  });

  it('pauses while an overlay is open and resumes when it closes', () => {
    const { context, handles, overlays, state } = setUp();
    state.attachViewport(VIEWPORT, context);
    state.handleIntent({ kind: 'open-overlay', overlay: 'pause' }, context);
    state.handleIntent({ kind: 'open-overlay', overlay: 'settings' }, context);
    expect(handles[0]?.setPaused.mock.calls).toEqual([[true]]);
    state.handleIntent({ kind: 'close-overlay' }, context);
    expect(handles[0]?.setPaused.mock.calls).toEqual([[true], [false]]);
    expect(overlays).toEqual(['pause', 'settings', null]);
  });

  it('starts a match attached while an overlay is open paused', () => {
    const { context, handles, state } = setUp();
    state.handleIntent({ kind: 'open-overlay', overlay: 'pause' }, context);
    state.attachViewport(VIEWPORT, context);
    expect(handles[0]?.setPaused.mock.calls).toEqual([[true]]);
  });

  it('returns to the menu on leave-match', () => {
    const { context, state } = setUp();
    state.handleIntent({ kind: 'leave-match' }, context);
    expect(context.transition.mock.calls).toEqual([['menu']]);
  });
});
