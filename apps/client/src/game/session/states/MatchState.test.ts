import { describe, expect, it, vi } from 'vitest';

import type { Overlay } from '../../../bridge/events';
import { FakeSessionContext } from '../../FakeSessionContext';
import { FakeViewportCanvas } from '../../FakeViewportCanvas';
import type { MatchViewport } from '../../MatchViewport.types';
import { SELECTION_ASSET_GROUPS } from '../selectionAssetGroups';
import { MatchState } from './MatchState';

const VIEWPORT: MatchViewport = {
  canvas: new FakeViewportCanvas(),
  chrome: { onInteriorChanged: vi.fn(), setLeaveInterior: vi.fn(), setOverview: vi.fn() },
  isExplorerShown: false,
};

/** A match state entered on a fake context, whose factory keeps every match it hands out. */
function setUp() {
  const context = new FakeSessionContext();
  const overlays: (Overlay | null)[] = [];
  context.bus.on('overlay', ({ overlay }) => overlays.push(overlay));
  const state = new MatchState();
  state.enter(context);
  return { context, handles: context.matches, overlays, state };
}

describe('MatchState', () => {
  it('releases every selection group once, in order, on enter', () => {
    const { context } = setUp();
    expect(context.calls.releaseAssets.map(([group]) => group)).toEqual(SELECTION_ASSET_GROUPS);
    expect(context.calls.createMatch).toEqual([]);
  });

  it('builds the match on attach and destroys it on detach', () => {
    const { context, handles, state } = setUp();
    const detach = state.attachViewport(VIEWPORT, context);
    expect(context.calls.createMatch).toEqual([[VIEWPORT, expect.any(Function)]]);
    detach();
    expect(handles[0]?.destroyCount).toBe(1);
  });

  it('replaces the match on a second attach, and a stale detach never ends the newer one', () => {
    const { context, handles, state } = setUp();
    const detachFirst = state.attachViewport(VIEWPORT, context);
    state.attachViewport(VIEWPORT, context);
    expect(handles[0]?.destroyCount).toBe(1);
    detachFirst();
    expect(handles[1]?.destroyCount).toBe(0);
  });

  it('aborts the match with the error when it cannot be built; the detach does nothing', () => {
    const { context, state } = setUp();
    const error = new Error('no 2D canvas');
    context.createMatchError = error;
    const detach = state.attachViewport(VIEWPORT, context);
    expect(context.calls.abortMatch).toEqual([[error]]);
    expect(() => {
      detach();
    }).not.toThrow();
  });

  it('ends the match on a crash of the running match, never of a replaced one (DEC-106)', () => {
    const { context, state } = setUp();
    const crash = { error: new Error('step failed'), tick: 7 };
    state.attachViewport(VIEWPORT, context);
    state.attachViewport(VIEWPORT, context);
    const [replaced, running] = context.calls.createMatch.map(([, onCrash]) => onCrash);

    replaced?.(crash);
    expect(context.calls.endCrashedMatch).toEqual([]);
    running?.(crash);
    expect(context.calls.endCrashedMatch).toEqual([[crash]]);
  });

  it('destroys the match, drops the world and closes any overlay on exit', () => {
    const { context, handles, overlays, state } = setUp();
    state.attachViewport(VIEWPORT, context);
    state.exit(context);
    expect(handles[0]?.destroyCount).toBe(1);
    expect(context.calls.dropWorld).toHaveLength(1);
    expect(overlays).toEqual([null]);
  });

  it('pauses while an overlay is open and resumes when it closes', () => {
    const { context, handles, overlays, state } = setUp();
    state.attachViewport(VIEWPORT, context);
    state.handleIntent({ kind: 'open-overlay', overlay: 'pause' }, context);
    state.handleIntent({ kind: 'open-overlay', overlay: 'settings' }, context);
    expect(handles[0]?.pauses).toEqual([true]);
    state.handleIntent({ kind: 'close-overlay' }, context);
    expect(handles[0]?.pauses).toEqual([true, false]);
    expect(overlays).toEqual(['pause', 'settings', null]);
  });

  it('starts a match attached while an overlay is open paused', () => {
    const { context, handles, state } = setUp();
    state.handleIntent({ kind: 'open-overlay', overlay: 'pause' }, context);
    state.attachViewport(VIEWPORT, context);
    expect(handles[0]?.pauses).toEqual([true]);
  });

  it('returns to the menu on leave-match', () => {
    const { context, state } = setUp();
    state.handleIntent({ kind: 'leave-match' }, context);
    expect(context.calls.transition).toEqual([['menu']]);
  });
});
