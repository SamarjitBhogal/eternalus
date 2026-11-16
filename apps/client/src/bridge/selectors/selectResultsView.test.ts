import { describe, expect, it } from 'vitest';

import { matchResultFixture } from '../__fixtures__/matchResultFixtures';
import type { MatchEnding } from '../domain.types';
import type { MatchMode } from '../events';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { createAppStore } from '../store';
import { selectResultsView } from './selectResultsView';

const CONTENT = {
  ...contentSlice.getInitialState(),
  verdictLines: {
    'objective-lost': {
      victory: 'Their {name} is down.',
      defeat: 'Our {name} is down.',
      draw: 'Each {name} is down.',
    },
  },
  sovereignNames: { light: 'Queen', dark: 'Tyrant' },
};

/** A store for a player on dark in a `mode` match, with the catalogue's verdict lines loaded. */
function storeFor(mode: MatchMode | null) {
  const store = createAppStore();
  store.dispatch(contentSlice.actions.catalogueLoaded(CONTENT));
  if (mode !== null) {
    store.dispatch(matchSetupSlice.actions.setTeam({ mode, seed: 1, playerTeam: 'dark' }));
  }
  return store;
}

const localMatchWon = (winner: 'light' | 'dark' | null) =>
  matchSlice.actions.ended({ result: matchResultFixture({ winner }), durationSeconds: 60 });

const duelEnded = (ending: MatchEnding) => matchSlice.actions.duelEnded(ending);

describe('selectResultsView', () => {
  it('shows the verdict and its line from content after a local match, naming the fallen sovereign', () => {
    const store = storeFor('local');
    store.dispatch(localMatchWon('dark'));

    expect(selectResultsView(store.getState())).toEqual({
      verdict: 'victory',
      status: { kind: 'verdict-line', text: 'Their Queen is down.' },
      canRematch: true,
    });
  });

  it('says the opponent left, with no verdict, after a Duel the other player left', () => {
    const store = storeFor('duel');
    store.dispatch(duelEnded({ winner: 'dark', reason: 'opponent-left' }));

    expect(selectResultsView(store.getState())).toEqual({
      verdict: null,
      status: { kind: 'opponent-left' },
      canRematch: false,
    });
  });

  it('says no result was recorded before any match ended', () => {
    const view = selectResultsView(storeFor('local').getState());

    expect(view.verdict).toBeNull();
    expect(view.status).toEqual({ kind: 'no-result' });
  });

  it('shows a finished Duel as a verdict with no status line', () => {
    const store = storeFor('duel');
    store.dispatch(duelEnded({ winner: 'light', reason: 'finished' }));

    expect(selectResultsView(store.getState())).toEqual({
      verdict: 'defeat',
      status: null,
      canRematch: false,
    });
  });

  it('offers a rematch only for a local match', () => {
    const rematch = (mode: MatchMode | null): boolean =>
      selectResultsView(storeFor(mode).getState()).canRematch;

    expect([rematch('local'), rematch('duel'), rematch(null)]).toEqual([true, false, false]);
  });

  it('keeps the same object after a countdown tick and builds a new one with a new result', () => {
    const store = storeFor('local');
    store.dispatch(localMatchWon('dark'));
    const before = selectResultsView(store.getState());

    store.dispatch(
      matchSetupSlice.actions.countdownChanged({ kind: 'results', remainingMs: 29_000 }),
    );
    expect(selectResultsView(store.getState())).toBe(before);
    expect(selectResultsView(store.getState())).toBe(selectResultsView(store.getState()));

    store.dispatch(localMatchWon('light'));
    expect(selectResultsView(store.getState())).not.toBe(before);
  });
});
