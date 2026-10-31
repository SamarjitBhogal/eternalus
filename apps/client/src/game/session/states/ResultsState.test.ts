import { describe, expect, it } from 'vitest';

import type { MenuRoute, UiIntent } from '../../../bridge/events';
import { FakeSessionContext } from '../../FakeSessionContext';
import { RESULTS_COUNTDOWN_MS } from '../sessionTiming.constants';
import { ResultsState } from './ResultsState';

/** A results state entered on a fake context, recording the countdown and the menu routes. */
function setUp() {
  const context = new FakeSessionContext();
  const countdown: number[] = [];
  const routes: MenuRoute[] = [];
  context.bus.on('countdown', ({ kind, remainingMs }) => {
    if (kind === 'results') countdown.push(remainingMs);
  });
  context.bus.on('menu-route', ({ route }) => routes.push(route));
  const state = new ResultsState();
  state.enter(context);
  return { context, countdown, routes, state };
}

describe('ResultsState', () => {
  it("releases the match's assets, loads the selection group and starts the 30 s countdown", () => {
    const { context, countdown } = setUp();

    expect(context.calls.releaseAssets).toEqual([['match']]);
    expect(context.calls.loadAssets.map(([groups]) => groups)).toEqual([['selection']]);
    expect(countdown).toEqual([RESULTS_COUNTDOWN_MS]);
    context.clock.advance(1_000);
    expect(countdown).toEqual([RESULTS_COUNTDOWN_MS, RESULTS_COUNTDOWN_MS - 1_000]);
  });

  it('goes to the menu when the countdown ends, not before (DEC-78)', () => {
    const { context, countdown } = setUp();

    context.clock.advance(RESULTS_COUNTDOWN_MS - 1);
    expect(context.calls.transition).toEqual([]);
    context.clock.advance(1);

    expect(context.calls.transition).toEqual([['menu']]);
    expect(countdown.at(-1)).toBe(0);
  });

  it('keeps the screen when the selection group fails to load', () => {
    const { context } = setUp();

    context.calls.loadAssets[0]?.[2](new Error('loader bug'));

    expect(context.calls.transition).toEqual([]);
  });

  it.each<[string, UiIntent, readonly (readonly unknown[])[], readonly MenuRoute[]]>([
    ['continue skips the wait to the menu (DEC-78)', { kind: 'continue' }, [['menu']], []],
    [
      'navigate goes to that menu route',
      { kind: 'navigate', route: 'profile' },
      [['menu']],
      ['profile'],
    ],
    ['start-match rematches with the same setup', { kind: 'start-match' }, [['loading']], []],
  ])(
    '%s, and leaving stops the countdown and the load and releases the selection group',
    (_name, intent, transitions, routes) => {
      const { context, countdown, routes: published, state } = setUp();

      state.handleIntent(intent, context);
      state.exit(context);
      context.clock.advance(RESULTS_COUNTDOWN_MS);

      expect(context.calls.transition).toEqual(transitions);
      expect(published).toEqual(routes);
      expect(context.calls.repeatMatchSetup).toHaveLength(intent.kind === 'start-match' ? 1 : 0);
      expect(countdown).toEqual([RESULTS_COUNTDOWN_MS]);
      expect(context.cancelledLoads).toEqual([0]);
      expect(context.calls.releaseAssets).toEqual([['match'], ['selection']]);
    },
  );

  it('ignores the other intents', () => {
    const { context, state } = setUp();

    state.handleIntent({ kind: 'leave-match' }, context);
    state.handleIntent({ kind: 'confirm-selection' }, context);

    expect(context.calls.transition).toEqual([]);
  });
});
