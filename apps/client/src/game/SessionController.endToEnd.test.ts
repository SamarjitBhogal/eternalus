import { createDefaultGameConfig, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { isSelectableClass } from '../bridge/selectionRules';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { firstAvailableSpecId, shippedCatalogue } from './content/__fixtures__/shippedCatalogue';
import { DeviceIntentSource } from './DeviceIntentSource';
import { Camera } from './engine/Camera';
import { KeyboardDevice } from './engine/input/KeyboardDevice';
import { MouseDevice } from './engine/input/MouseDevice';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { FakeBrowserTarget } from './FakeBrowserTarget';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { InputMapper } from './input/InputMapper';
import { PRESETS } from './input/keybindings';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH, MS_PER_SECOND } from './Match.constants';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { MatchHost } from './MatchHost';
import type { MatchViewport } from './MatchViewport.types';
import type { MatchFactory } from './SessionController.types';
import { seatedConfig } from './seatedConfig';
import { REVEAL_COUNTDOWN_MS, SELECT_COUNTDOWN_MS } from './session/sessionTiming.constants';
import { testSession } from './testSessionDeps';

const CONFIG = createDefaultGameConfig();

const viewport = (canvas: FakeViewportCanvas): MatchViewport => ({
  canvas,
  chrome: {
    onInteriorChanged: () => undefined,
    onExplorerChanged: () => undefined,
    setLeaveInterior: () => undefined,
    setOverview: () => undefined,
  },
  isExplorerShown: false,
});

describe('SessionController with the real match, end to end', () => {
  /** One build of the real `Match` and `MatchHost`, with every browser part a fake. */
  type Build = {
    readonly match: Match;
    readonly scheduler: FakeFrameScheduler;
    readonly window: FakeBrowserTarget;
    readonly document: FakeBrowserTarget;
    /** How often each `simulation.on` unsubscribe ran. */
    readonly unsubscribed: number[];
  };

  /** A session on `bus` whose factory builds the real match on fakes, recording each build. */
  function realSession() {
    const bus = new TypedEventBus<BridgeEventMap>();
    const builds: Build[] = [];
    const createMatch: MatchFactory = (request, attached) => {
      const window = new FakeBrowserTarget();
      const document = new FakeBrowserTarget();
      const scheduler = new FakeFrameScheduler();
      const simulation = new Simulation({
        config: seatedConfig(CONFIG, request.world.map, request.player),
        seed: request.setup.seed,
        logger: new NullLogger(),
      });
      const unsubscribed: number[] = [];
      const subscribe = simulation.on.bind(simulation);
      vi.spyOn(simulation, 'on').mockImplementation((type, handler) => {
        const index = unsubscribed.push(0) - 1;
        const unsubscribe = subscribe(type, handler);
        return () => {
          unsubscribed[index] = (unsubscribed[index] ?? 0) + 1;
          unsubscribe();
        };
      });
      const mapper = new InputMapper(PRESETS.wasd);
      const keyboard = new KeyboardDevice((code) => mapper.isBound(code));
      const mouse = new MouseDevice();
      const renderer = new RecordingRenderer();
      const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
      const match = new Match({
        simulation,
        world: request.world,
        tickRate: CONFIG.tickRate,
        scheduler,
        renderer,
        camera,
        input: new DeviceIntentSource([keyboard, mouse], mapper),
        player: request.player,
        logger: new NullLogger(),
        onCrash: request.onCrash,
        bridge: {
          bus,
          publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
          captureKinds: request.captureKinds,
        },
      });
      const host = new MatchHost({
        match,
        viewport: attached,
        window,
        document,
        keyboard,
        mouse,
        input: { releaseAll: () => undefined },
        bus,
        mapper,
        adapters: [renderer, camera],
      });
      host.start();
      builds.push({ match, scheduler, window, document, unsubscribed });
      return host;
    };
    const session = testSession({ bus, createMatch });
    /** Boot, character select (the magus class, its first Legend), the reveal and the match load. */
    const toMatch = async (): Promise<void> => {
      session.controller.start();
      await session.resolveLoads();
      session.intent({ kind: 'start-match' });
      await session.resolveLoads();
      session.intent({
        kind: 'select-class',
        classId: 'magus',
        specId: firstAvailableSpecId('magus'),
      });
      session.intent({ kind: 'confirm-selection' });
      // DEC-60: LOCK IN holds the full select countdown; the reveal follows it.
      session.clock.advance(SELECT_COUNTDOWN_MS);
      session.clock.advance(REVEAL_COUNTDOWN_MS);
      await session.resolveLoads();
    };
    /** Every listener on one build's window, document and canvas. */
    const listeners = (build: Build | undefined, canvas: FakeViewportCanvas): number =>
      (build?.window.listenerCount() ?? -1) +
      (build?.document.listenerCount() ?? -1) +
      canvas.listenerCount();
    return { ...session, builds, listeners, toMatch };
  }

  it('runs nothing before the match, plays it, then leaves 0 frames and 0 listeners', async () => {
    const session = realSession();
    await session.toMatch();
    const busBefore = session.bus.listenerCount();
    const canvas = new FakeViewportCanvas();

    session.controller.attachViewport(viewport(canvas));
    const [build] = session.builds;
    expect(build?.scheduler.hasPendingFrame).toBe(true);
    expect(build?.window.listenerCount()).toBeGreaterThan(0);
    build?.scheduler.runFrames(31, MS_PER_SECOND / CONFIG.tickRate);

    const state = session.store.getState();
    const player = build?.match.snapshot.entities.find(
      (entity) => entity.id === build.match.playerEntityId,
    );
    expect(state.match.clock?.tick).toBeGreaterThan(0);
    expect(state.hud.player?.health).toBe(player?.health?.current);
    expect(player).toMatchObject({ kind: 'magus', team: state.matchSetup.playerTeam });

    session.intent({ kind: 'leave-match' });
    expect(build?.scheduler.hasPendingFrame).toBe(false);
    expect(session.listeners(build, canvas)).toBe(0);
    expect(session.bus.listenerCount()).toBe(busBefore);
  });

  it('ends a match whose tick throws: the menu with match-crashed, 0 frames, 0 listeners (DEC-106)', async () => {
    const session = realSession();
    await session.toMatch();
    const busBefore = session.bus.listenerCount();
    const canvas = new FakeViewportCanvas();
    session.controller.attachViewport(viewport(canvas));
    const [build] = session.builds;
    build?.scheduler.runFrames(2, MS_PER_SECOND / CONFIG.tickRate);
    vi.spyOn(Simulation.prototype, 'step').mockImplementation(() => {
      throw new Error('step failed');
    });

    build?.scheduler.advance(MS_PER_SECOND / CONFIG.tickRate);

    expect(session.controller.phase).toBe('menu');
    expect(session.store.getState().session.reason).toBe('match-crashed');
    expect(build?.scheduler.hasPendingFrame).toBe(false);
    expect(session.listeners(build, canvas)).toBe(0);
    expect(session.bus.listenerCount()).toBe(busBefore);
  });

  it('tears the first StrictMode match down completely before the second runs', async () => {
    const session = realSession();
    await session.toMatch();
    const busBefore = session.bus.listenerCount();
    const firstCanvas = new FakeViewportCanvas();
    const secondCanvas = new FakeViewportCanvas();

    const detach = session.controller.attachViewport(viewport(firstCanvas));
    const busWithOne = session.bus.listenerCount();
    detach();
    session.controller.attachViewport(viewport(secondCanvas));
    const [first, second] = session.builds;

    expect(first?.scheduler.hasPendingFrame).toBe(false);
    expect(session.listeners(first, firstCanvas)).toBe(0);
    // The match makes no simulation subscription of its own (core spawns the player from the seat).
    expect(first?.unsubscribed).toEqual([]);
    expect(session.bus.listenerCount()).toBe(busWithOne);

    session.intent({ kind: 'leave-match' });
    expect(second?.scheduler.hasPendingFrame).toBe(false);
    expect(session.listeners(second, secondCanvas)).toBe(0);
    expect(second?.unsubscribed).toEqual([]);
    expect(session.bus.listenerCount()).toBe(busBefore);
  });

  it('spawns every selectable class of the shipped catalogue as a Legend', () => {
    const selectable = shippedCatalogue().load().legendClasses.filter(isSelectableClass);
    expect(selectable.length).toBeGreaterThan(0);
    for (const { classId } of selectable) {
      const simulation = new Simulation({
        config: createDefaultGameConfig({
          match: { seat: { definitionId: classId, at: { x: 10, y: 10 } } },
        }),
        seed: 1,
        logger: new NullLogger(),
      });
      const { match, entities } = simulation.snapshot();
      const kinds = entities
        .filter((entity) => entity.id === match.humanLegendId)
        .map((entity) => entity.kind);
      expect(kinds).toEqual([classId]);
    }
  });
});
