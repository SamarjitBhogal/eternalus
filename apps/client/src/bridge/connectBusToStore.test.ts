import { describe, expect, it } from 'vitest';

import type { DisplayCatalogue } from './catalogue.types';
import { connectBusToStore } from './connectBusToStore';
import type { BridgeEventMap, CreditEntry, MatchSetupDraft, RosterEntry } from './events';
import { FIGMA_HUD_PLAYER, figmaHudState, TEST_HUD_CATALOGUE } from './hudFixtures';
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
    const catalogue: DisplayCatalogue = {
      legendClasses: [],
      backgroundSets: [],
      profileDisplayName: 'Chronicle',
      classSelectLayout: 'alternate',
      selectionBannerAssetId: 'selection-banner',
      selectClassChromeAssetId: 'select-class-chrome',
      lockInChromeAssetId: 'lock-in-chrome',
      effectsRenderer: 'css',
      contrastMode: 'minimums',
      hud: TEST_HUD_CATALOGUE,
      teamNames: { light: 'Lux', dark: 'Umbra' },
    };
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

  it('clears the class pick on a null class-selection', () => {
    const { bus, store } = connected();
    bus.emit('match-setup', DRAFT);
    bus.emit('class-selection', { classId: 'magus', specId: 'oracle' });
    bus.emit('class-selection', null);
    expect(store.getState().matchSetup.selection).toEqual({ classId: null, specId: null });
  });

  it('copies the match clock, HUD state and announcements', () => {
    const { bus, store } = connected();
    bus.emit('match-clock', { tick: 60, seconds: 2 });
    bus.emit('announcement', { id: 'first-blood', text: 'First blood' });
    bus.emit('hud-state', { player: FIGMA_HUD_PLAYER });
    expect(store.getState().match.clock).toEqual({ tick: 60, seconds: 2 });
    expect(store.getState().hud.player).toBe(FIGMA_HUD_PLAYER);
    expect(store.getState().hud.announcements).toEqual([
      { id: 'first-blood', text: 'First blood' },
    ]);
    bus.emit('hud-state', { player: null });
    expect(store.getState().hud.player).toBeNull();
    expect(store.getState().hud.announcements).toHaveLength(1);
  });

  it('stores the structure and capture rosters as published', () => {
    const { bus, store } = connected();
    const { structures, capturePoints } = figmaHudState().match;
    bus.emit('structure-state', { structures });
    bus.emit('capture-state', { points: capturePoints });
    expect(store.getState().match.structures).toBe(structures);
    expect(store.getState().match.capturePoints).toBe(capturePoints);
  });

  it('stores the asset URLs of a group, empties them on release, and stores the credits', () => {
    const { bus, store } = connected();
    const urls = { 'selection-banner': '/a.webp', 'oracle-portrait@ally-tile': '/b.webp' };
    bus.emit('asset-urls', { group: 'selection', urls });
    expect(store.getState().assets.urlsByGroup.selection).toBe(urls);
    expect(store.getState().assets.urlsByGroup.match).toEqual({});
    bus.emit('asset-urls', { group: 'selection', urls: {} });
    expect(store.getState().assets.urlsByGroup.selection).toEqual({});
    const entries: readonly CreditEntry[] = [
      {
        licenceId: 'owner',
        work: 'Eternalus art',
        licenceName: 'Owner',
        notice: '',
        licenceText: null,
        assets: [{ assetId: 'selection-banner', source: 'Figma 62:144' }],
      },
    ];
    bus.emit('credits', { entries });
    expect(store.getState().assets.credits).toBe(entries);
  });

  it('starts every published setup, and its clearing, with empty HUD and match state', () => {
    for (const draft of [DRAFT, null]) {
      const { bus, store } = connected();
      const { structures } = figmaHudState().match;
      bus.emit('hud-state', { player: FIGMA_HUD_PLAYER });
      bus.emit('match-clock', { tick: 60, seconds: 2 });
      bus.emit('structure-state', { structures });
      bus.emit('match-setup', draft);
      expect(store.getState().hud.player).toBeNull();
      expect(store.getState().match).toEqual({
        clock: null,
        structures: [],
        capturePoints: [],
        result: null,
      });
    }
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
