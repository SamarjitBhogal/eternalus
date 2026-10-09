import { describe, expect, it } from 'vitest';

import { connectBusToStore } from './connectBusToStore';
import type { BridgeEventMap, MatchSetupDraft, RosterEntry } from './events';
import { createAppStore } from './store';
import { TypedEventBus } from './TypedEventBus';

const entry = (legendId: string, isPlayer: boolean): RosterEntry => ({
  legendId,
  displayName: legendId,
  classId: 'warrior',
  specId: null,
  isBot: !isPlayer,
  isPlayer,
  isRover: isPlayer,
  team: 'dark',
});

const DRAFT: MatchSetupDraft = {
  seed: 7,
  playerTeam: 'dark',
  allies: [entry('dark-1', true)],
  enemies: [entry('light-1', false)],
};

function connected() {
  const bus = new TypedEventBus<BridgeEventMap>();
  const store = createAppStore();
  const disconnect = connectBusToStore(bus, store.dispatch);
  return { bus, store, disconnect };
}

describe('connectBusToStore', () => {
  it('copies session events into the session slice', () => {
    const { bus, store } = connected();
    bus.emit('session-phase', { phase: 'menu', reason: 'select-timeout' });
    bus.emit('menu-route', { route: 'about' });
    bus.emit('overlay', { overlay: 'pause' });
    expect(store.getState().session).toEqual({
      phase: 'menu',
      reason: 'select-timeout',
      menuRoute: 'about',
      overlay: 'pause',
    });
  });

  it('copies content and loading progress', () => {
    const { bus, store } = connected();
    const catalogue = { legendClasses: [], backgroundSets: [], profileDisplayName: 'Chronicle' };
    bus.emit('content-catalogue', catalogue);
    bus.emit('loading-progress', {
      group: 'selection',
      loaded: 1,
      total: 2,
      bytesLoaded: 10,
      bytesTotal: 20,
      status: 'loading',
    });
    expect(store.getState().content).toEqual(catalogue);
    expect(store.getState().loading.status).toBe('loading');
    expect(store.getState().loading.group).toBe('selection');
  });

  it('fills the match setup from setup, selection and countdown events, and clears it on null', () => {
    const { bus, store } = connected();
    bus.emit('match-setup', DRAFT);
    bus.emit('class-selection', { classId: 'magus', specId: null });
    bus.emit('countdown', { kind: 'select', remainingMs: 59_000 });
    bus.emit('countdown', { kind: 'reveal', remainingMs: 9_000 });
    expect(store.getState().matchSetup).toEqual({
      seed: 7,
      playerTeam: 'dark',
      selection: { classId: 'magus', specId: null },
      allies: DRAFT.allies,
      enemies: DRAFT.enemies,
      countdownMs: 59_000,
      revealMs: 9_000,
    });
    bus.emit('match-setup', null);
    expect(store.getState().matchSetup.playerTeam).toBeNull();
    expect(store.getState().matchSetup.allies).toEqual([]);
  });

  it('copies the match clock, HUD state and announcements', () => {
    const { bus, store } = connected();
    bus.emit('match-clock', { tick: 60, seconds: 2 });
    bus.emit('announcement', { id: 'first-blood', text: 'First blood' });
    bus.emit('hud-state', {
      health: { current: 5, max: 10 },
      aether: { current: 1, max: 2 },
      xp: { level: 1, current: 0, next: 100 },
      abilities: [],
      scores: [],
    });
    expect(store.getState().match.clock).toEqual({ tick: 60, seconds: 2 });
    expect(store.getState().hud.health).toEqual({ current: 5, max: 10 });
    expect(store.getState().hud.announcements).toEqual([
      { id: 'first-blood', text: 'First blood' },
    ]);
  });

  it('copies the settings state', () => {
    const { bus, store } = connected();
    const settings = {
      ...store.getState().settings,
      audio: { master: 0.5, music: 0.25, effects: 1 },
    };
    bus.emit('settings', settings);
    expect(store.getState().settings).toEqual(settings);
  });

  it('unsubscribes every handler on disconnect', () => {
    const { bus, store, disconnect } = connected();
    expect(bus.listenerCount()).toBeGreaterThan(0);
    disconnect();
    expect(bus.listenerCount()).toBe(0);
    bus.emit('session-phase', { phase: 'match', reason: null });
    expect(store.getState().session.phase).toBe('boot');
  });
});
