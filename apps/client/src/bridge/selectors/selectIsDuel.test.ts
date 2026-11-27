import { describe, expect, it } from 'vitest';

import { connectBusToStore } from '../connectBusToStore';
import type { BridgeEventMap } from '../events';
import { matchSlice } from '../slices/matchSlice';
import { createAppStore } from '../store';
import { TypedEventBus } from '../TypedEventBus';
import { selectIsDuel } from './selectIsDuel';

function setup() {
  const bus = new TypedEventBus<BridgeEventMap>();
  const store = createAppStore();
  connectBusToStore(bus, store.dispatch);
  return { bus, store };
}

describe('selectIsDuel', () => {
  it('is false with no setup and for a local match', () => {
    const { bus, store } = setup();
    expect(selectIsDuel(store.getState())).toBe(false);
    bus.emit('match-setup', {
      mode: 'local',
      seed: 1,
      playerTeam: 'light',
      allies: [],
      enemies: [],
    });
    expect(selectIsDuel(store.getState())).toBe(false);
  });

  it('holds through the Duel start: match-found, a drop during VERSUS, then the setup', () => {
    const { bus, store } = setup();
    // matched
    bus.emit('duel-versus', { own: 'Ana', opponent: 'Ben' });
    // the opponent drops during VERSUS
    bus.emit('duel-opponent-presence', { graceMs: 10_000 });
    // started: the setup resets the match slice, then the session re-sends the presence
    bus.emit('match-setup', {
      mode: 'duel',
      seed: 1,
      playerTeam: 'light',
      allies: [],
      enemies: [],
    });
    bus.emit('duel-opponent-presence', { graceMs: 10_000 });
    expect(selectIsDuel(store.getState())).toBe(true);
    expect(matchSlice.selectors.selectOpponentGraceMs(store.getState())).toBe(10_000);
  });
});
