import { describe, expect, it } from 'vitest';

import type { MatchSetupDraft, SessionPhase } from '../bridge/events';
import { firstAvailableSpecId } from './content/__fixtures__/shippedCatalogue';
import type { SessionContext, SessionState } from './SessionController.types';
import { createDefaultSessionStates } from './session/defaultSessionStates';
import { REVEAL_COUNTDOWN_MS, SELECT_COUNTDOWN_MS } from './session/sessionTiming.constants';
import { testSession } from './testSessionDeps';

/** A session in the menu: started, its boot load settled. */
async function inMenu(states?: Readonly<Record<SessionPhase, SessionState>>) {
  const session = testSession(states === undefined ? {} : { states });
  session.controller.start();
  await session.resolveLoads();
  return session;
}

/** Drives the real states from boot to character-select. */
async function atCharacterSelect() {
  const session = await inMenu();
  session.intent({ kind: 'start-match' });
  await session.resolveLoads();
  return session;
}

describe('SessionController with the default states', () => {
  it('boots into the menu with the content catalogue once the boot group has loaded', async () => {
    const { controller, store, phases, resolveLoads } = testSession();
    controller.start();
    expect(phases).toEqual(['boot']);
    expect(store.getState().loading).toMatchObject({ group: 'boot', status: 'loading' });

    await resolveLoads();
    expect(phases).toEqual(['boot', 'menu']);
    const state = store.getState();
    expect(state.session.phase).toBe('menu');
    expect(state.session.menuRoute).toBe('home');
    expect(state.content.legendClasses.map((card) => card.classId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'harbinger',
    ]);
    expect(state.loading).toMatchObject({ group: 'boot', status: 'ready' });
  });

  it('cannot be started twice', () => {
    const { controller } = testSession();
    controller.start();
    expect(() => {
      controller.start();
    }).toThrow('already started');
  });

  it('changes the menu route on navigate without leaving the menu', async () => {
    const { store, intent } = await inMenu();
    intent({ kind: 'navigate', route: 'about' });
    expect(store.getState().session).toMatchObject({ phase: 'menu', menuRoute: 'about' });
  });

  it('walks the whole start-match flow to the match and back to the menu', async () => {
    const { controller, clock, store, themeRoot, phases, intent, resolveLoads } = await inMenu();

    intent({ kind: 'start-match' });
    const setup = store.getState().matchSetup;
    expect(controller.phase).toBe('loading');
    expect(store.getState().loading).toMatchObject({ group: 'selection', status: 'loading' });
    expect(setup.allies).toHaveLength(10);
    expect(setup.enemies).toHaveLength(10);
    expect(setup.playerTeam).not.toBeNull();
    expect(themeRoot.dataset.team).toBe(setup.playerTeam);

    await resolveLoads();
    expect(controller.phase).toBe('character-select');
    expect(store.getState().loading.status).toBe('ready');
    expect(store.getState().matchSetup.countdownMs).toBe(SELECT_COUNTDOWN_MS);
    clock.advance(1_000);
    expect(store.getState().matchSetup.countdownMs).toBe(SELECT_COUNTDOWN_MS - 1_000);

    intent({ kind: 'select-class', classId: 'sentinel' });
    expect(store.getState().matchSetup.selection).toEqual({ classId: 'sentinel', specId: null });
    intent({ kind: 'select-class', classId: 'sentinel', specId: firstAvailableSpecId('sentinel') });
    intent({ kind: 'confirm-selection' });
    expect(controller.phase).toBe('character-select');
    expect(store.getState().matchSetup.isLockedIn).toBe(true);
    clock.advance(SELECT_COUNTDOWN_MS - 1_000);
    expect(controller.phase).toBe('pre-launch');
    expect(store.getState().matchSetup.revealMs).toBe(REVEAL_COUNTDOWN_MS);

    clock.advance(REVEAL_COUNTDOWN_MS);
    expect(controller.phase).toBe('match-loading');
    expect(store.getState().loading.group).toBe('match');
    await resolveLoads();
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

  it('cancels to the menu with select-timeout when the countdown ends with no selection', async () => {
    const { controller, clock, store } = await atCharacterSelect();
    clock.advance(SELECT_COUNTDOWN_MS - 1);
    expect(controller.phase).toBe('character-select');
    clock.advance(1);
    expect(controller.phase).toBe('menu');
    expect(store.getState().session.reason).toBe('select-timeout');
    expect(store.getState().matchSetup.countdownMs).toBe(0);
  });

  it('starts character select with nothing selected, and the countdown ends in the menu', async () => {
    const { controller, clock, store } = await atCharacterSelect();
    expect(store.getState().matchSetup.selection).toEqual({ classId: null, specId: null });
    clock.advance(SELECT_COUNTDOWN_MS);
    expect(controller.phase).toBe('menu');
    expect(store.getState().session.reason).toBe('select-timeout');
  });

  it('starts no match when the countdown ends with a pick not locked in (DEC-102)', async () => {
    const { controller, clock, store, intent } = await atCharacterSelect();
    intent({ kind: 'select-class', classId: 'warrior', specId: firstAvailableSpecId('warrior') });
    clock.advance(SELECT_COUNTDOWN_MS);
    expect(controller.phase).toBe('menu');
    expect(store.getState().session.reason).toBe('select-timeout');
  });

  it('ignores unknown classes or specs and a confirm with nothing selected', async () => {
    const { controller, store, intent } = await atCharacterSelect();
    // `harbinger` is the locked Harbinger card: shown, never selectable (DEC-48).
    intent({ kind: 'select-class', classId: 'harbinger' });
    intent({ kind: 'select-class', classId: 'unknown-class' });
    // A Sentinel Legend under the magus class: a known Legend of another class.
    intent({ kind: 'select-class', classId: 'magus', specId: firstAvailableSpecId('sentinel') });
    intent({ kind: 'confirm-selection' });
    expect(controller.phase).toBe('character-select');
    expect(store.getState().matchSetup.selection).toEqual({ classId: null, specId: null });
  });

  it('cancels from loading and from character select, and the old loads and timers never finish', async () => {
    const loading = await inMenu();
    loading.intent({ kind: 'start-match' });
    loading.intent({ kind: 'cancel-match' });
    expect(loading.store.getState().session).toMatchObject({ phase: 'menu', reason: 'cancelled' });
    await loading.resolveLoads();
    expect(loading.controller.phase).toBe('menu');

    const selecting = await atCharacterSelect();
    selecting.intent({ kind: 'cancel-match' });
    expect(selecting.store.getState().session.reason).toBe('cancelled');
    selecting.clock.advance(SELECT_COUNTDOWN_MS);
    expect(selecting.phases.at(-1)).toBe('menu');
    expect(selecting.store.getState().session.reason).toBe('cancelled');
  });

  it('leaves results for a menu route, or rematches with the same setup', async () => {
    // The real match state (it releases the selection assets), plus a handle on the context.
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
    const session = await inMenu(states);
    const playToResults = async (): Promise<void> => {
      session.intent({ kind: 'start-match' });
      await session.resolveLoads();
      session.intent({
        kind: 'select-class',
        classId: 'sentinel',
        specId: firstAvailableSpecId('sentinel'),
      });
      session.intent({ kind: 'confirm-selection' });
      // DEC-60: LOCK IN holds the full select countdown; the reveal follows it.
      session.clock.advance(SELECT_COUNTDOWN_MS);
      session.clock.advance(REVEAL_COUNTDOWN_MS);
      await session.resolveLoads();
      captured.context?.transition('results');
    };

    await playToResults();
    expect(session.controller.phase).toBe('results');
    session.intent({ kind: 'navigate', route: 'profile' });
    expect(session.store.getState().session).toMatchObject({ phase: 'menu', menuRoute: 'profile' });

    const drafts: (MatchSetupDraft | null)[] = [];
    session.bus.on('match-setup', (draft) => drafts.push(draft));
    await playToResults();
    const before = session.store.getState().matchSetup;
    session.intent({ kind: 'start-match' });
    const after = session.store.getState().matchSetup;
    expect(session.controller.phase).toBe('loading');
    expect(after).toMatchObject({ seed: before.seed, playerTeam: before.playerTeam });
    // The rematch shows the setup as built, not last match's bot Legends or mirror (DEC-61).
    expect(drafts).toHaveLength(2);
    expect(drafts[1]).toBe(drafts[0]);
    expect(after.allies).toEqual(drafts[0]?.allies);
    expect([...after.allies, ...after.enemies].every((entry) => entry.specId === null)).toBe(true);
    expect(after.isLockedIn).toBe(false);
    expect(after.selection).toEqual({ classId: null, specId: null });
    expect(session.themeRoot.dataset.team).toBe(before.playerTeam);
  });

  it('destroy stops timers and intent handling and leaves no bus listeners', async () => {
    const { controller, clock, bus, disconnect, stopRecording, intent } = await atCharacterSelect();
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
