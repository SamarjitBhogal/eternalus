import { describe, expect, it } from 'vitest';

import { connectBusToStore } from '../bridge/connectBusToStore';
import type { BridgeEventMap, SessionPhase, UiIntent } from '../bridge/events';
import { createAppStore } from '../bridge/store';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { placeholderCatalogue } from './content/placeholderCatalogue';
import { PLACEHOLDER_MATCH_CONFIG } from './content/placeholderSetup';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { SessionController } from './SessionController';
import type { SessionContext, SessionState } from './SessionController.types';
import { createDefaultSessionStates } from './session/defaultSessionStates';
import { LcgRng } from './session/LcgRng';
import {
  PLACEHOLDER_LOAD_MS,
  REVEAL_COUNTDOWN_MS,
  SELECT_COUNTDOWN_MS,
} from './session/sessionTiming.constants';

function setUp(
  states: Readonly<Record<SessionPhase, SessionState>> = createDefaultSessionStates(),
) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const clock = new FakeSessionClock();
  const store = createAppStore();
  const disconnect = connectBusToStore(bus, store.dispatch);
  const themeRoot: Pick<HTMLElement, 'dataset'> = { dataset: {} };
  const phases: SessionPhase[] = [];
  const stopRecording = bus.on('session-phase', ({ phase }) => phases.push(phase));
  // A fresh seed per setup, so a rematch that rebuilt the setup would show a different seed.
  let seed = 41;
  const controller = new SessionController({
    bus,
    clock,
    states,
    catalogue: placeholderCatalogue,
    matchConfig: PLACEHOLDER_MATCH_CONFIG,
    playerName: 'Tester',
    seedSource: () => ++seed,
    createRng: (seed) => new LcgRng(seed),
    themeRoot,
  });
  const intent = (value: UiIntent): void => {
    bus.emit('ui-intent', value);
  };
  return { bus, clock, store, disconnect, stopRecording, themeRoot, phases, controller, intent };
}

/** Drives the real states from boot to character-select. */
function atCharacterSelect() {
  const session = setUp();
  session.controller.start();
  session.intent({ kind: 'start-match' });
  session.clock.advance(PLACEHOLDER_LOAD_MS);
  return session;
}

describe('SessionController with the default states', () => {
  it('boots into the menu with the content catalogue and a finished boot load', () => {
    const { controller, store, phases } = setUp();
    controller.start();
    expect(phases).toEqual(['boot', 'menu']);
    const state = store.getState();
    expect(state.session.phase).toBe('menu');
    expect(state.session.menuRoute).toBe('home');
    expect(state.content.legendClasses.map((card) => card.classId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
    ]);
    expect(state.loading).toMatchObject({ group: 'boot', status: 'ready' });
  });

  it('cannot be started twice', () => {
    const { controller } = setUp();
    controller.start();
    expect(() => {
      controller.start();
    }).toThrow('already started');
  });

  it('changes the menu route on navigate without leaving the menu', () => {
    const { controller, store, intent } = setUp();
    controller.start();
    intent({ kind: 'navigate', route: 'about' });
    expect(store.getState().session).toMatchObject({ phase: 'menu', menuRoute: 'about' });
  });

  it('walks the whole start-match flow to the match and back to the menu', () => {
    const { controller, clock, store, themeRoot, phases, intent } = setUp();
    controller.start();

    intent({ kind: 'start-match' });
    const setup = store.getState().matchSetup;
    expect(controller.phase).toBe('loading');
    expect(store.getState().loading).toMatchObject({ group: 'selection', status: 'loading' });
    expect(setup.allies).toHaveLength(10);
    expect(setup.enemies).toHaveLength(10);
    expect(setup.playerTeam).not.toBeNull();
    expect(themeRoot.dataset.team).toBe(setup.playerTeam);

    clock.advance(PLACEHOLDER_LOAD_MS);
    expect(controller.phase).toBe('character-select');
    expect(store.getState().loading.status).toBe('ready');
    expect(store.getState().matchSetup.countdownMs).toBe(SELECT_COUNTDOWN_MS);
    clock.advance(1_000);
    expect(store.getState().matchSetup.countdownMs).toBe(SELECT_COUNTDOWN_MS - 1_000);

    intent({ kind: 'select-class', classId: 'magus' });
    expect(store.getState().matchSetup.selection).toEqual({ classId: 'magus', specId: null });
    intent({ kind: 'confirm-selection' });
    expect(controller.phase).toBe('pre-launch');
    expect(store.getState().matchSetup.revealMs).toBe(REVEAL_COUNTDOWN_MS);

    clock.advance(REVEAL_COUNTDOWN_MS);
    expect(controller.phase).toBe('match-loading');
    expect(store.getState().loading.group).toBe('match');
    clock.advance(PLACEHOLDER_LOAD_MS);
    expect(controller.phase).toBe('match');

    intent({ kind: 'open-overlay', overlay: 'pause' });
    expect(store.getState().session.overlay).toBe('pause');
    intent({ kind: 'close-overlay' });
    expect(store.getState().session.overlay).toBeNull();
    intent({ kind: 'open-overlay', overlay: 'settings' });
    intent({ kind: 'leave-match' });

    expect(phases).toEqual([
      'boot',
      'menu',
      'loading',
      'character-select',
      'pre-launch',
      'match-loading',
      'match',
      'menu',
    ]);
    expect(store.getState().session).toMatchObject({ reason: null, overlay: null });
    expect(store.getState().matchSetup.playerTeam).toBeNull();
    expect(themeRoot.dataset.team).toBeUndefined();
  });

  it('cancels to the menu with select-timeout when the countdown ends with no selection', () => {
    const { controller, clock, store } = atCharacterSelect();
    clock.advance(SELECT_COUNTDOWN_MS - 1);
    expect(controller.phase).toBe('character-select');
    clock.advance(1);
    expect(controller.phase).toBe('menu');
    expect(store.getState().session.reason).toBe('select-timeout');
    expect(store.getState().matchSetup.countdownMs).toBe(0);
  });

  it('goes to pre-launch when the countdown ends with an unconfirmed selection', () => {
    const { controller, clock, intent } = atCharacterSelect();
    intent({ kind: 'select-class', classId: 'warrior', specId: 'knight' });
    clock.advance(SELECT_COUNTDOWN_MS);
    expect(controller.phase).toBe('pre-launch');
  });

  it('ignores unknown classes or specs and a confirm with nothing selected', () => {
    const { controller, store, intent } = atCharacterSelect();
    intent({ kind: 'select-class', classId: 'flying' });
    intent({ kind: 'select-class', classId: 'magus', specId: 'colossus' });
    intent({ kind: 'confirm-selection' });
    expect(controller.phase).toBe('character-select');
    expect(store.getState().matchSetup.selection).toEqual({ classId: null, specId: null });
  });

  it('cancels from loading and from character select, and the old timers never fire', () => {
    const loading = setUp();
    loading.controller.start();
    loading.intent({ kind: 'start-match' });
    loading.intent({ kind: 'cancel-match' });
    expect(loading.store.getState().session).toMatchObject({ phase: 'menu', reason: 'cancelled' });
    loading.clock.advance(PLACEHOLDER_LOAD_MS);
    expect(loading.controller.phase).toBe('menu');

    const selecting = atCharacterSelect();
    selecting.intent({ kind: 'cancel-match' });
    expect(selecting.store.getState().session.reason).toBe('cancelled');
    selecting.clock.advance(SELECT_COUNTDOWN_MS);
    expect(selecting.phases.at(-1)).toBe('menu');
    expect(selecting.store.getState().session.reason).toBe('cancelled');
  });

  it('leaves results for a menu route, or rematches with the same setup', () => {
    const captured: { context: SessionContext | null } = { context: null };
    const states = {
      ...createDefaultSessionStates(),
      match: {
        phase: 'match',
        enter: (context: SessionContext) => {
          captured.context = context;
        },
      },
    } satisfies Record<SessionPhase, SessionState>;
    const session = setUp(states);
    const playToResults = (): void => {
      session.intent({ kind: 'start-match' });
      session.clock.advance(PLACEHOLDER_LOAD_MS);
      session.intent({ kind: 'select-class', classId: 'sentinel' });
      session.intent({ kind: 'confirm-selection' });
      session.clock.advance(REVEAL_COUNTDOWN_MS + PLACEHOLDER_LOAD_MS);
      captured.context?.transition('results');
    };
    session.controller.start();

    playToResults();
    expect(session.controller.phase).toBe('results');
    session.intent({ kind: 'navigate', route: 'profile' });
    expect(session.store.getState().session).toMatchObject({ phase: 'menu', menuRoute: 'profile' });

    playToResults();
    const before = session.store.getState().matchSetup;
    session.intent({ kind: 'start-match' });
    const after = session.store.getState().matchSetup;
    expect(session.controller.phase).toBe('loading');
    expect(after).toMatchObject({ seed: before.seed, playerTeam: before.playerTeam });
    expect(after.allies).toEqual(before.allies);
    expect(after.selection).toEqual({ classId: null, specId: null });
    expect(session.themeRoot.dataset.team).toBe(before.playerTeam);
  });

  it('destroy stops timers and intent handling and leaves no bus listeners', () => {
    const { controller, clock, bus, disconnect, stopRecording, intent } = atCharacterSelect();
    controller.destroy();
    controller.destroy();
    disconnect();
    stopRecording();
    expect(bus.listenerCount()).toBe(0);
    clock.advance(SELECT_COUNTDOWN_MS);
    intent({ kind: 'cancel-match' });
    expect(controller.phase).toBeNull();
  });
});
