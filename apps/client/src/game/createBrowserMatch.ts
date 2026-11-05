import { type GameConfig, makeLogRecord, SEVERITY, Simulation } from '@eternalus/core';

import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import type { MatchEvidence } from '../data/logging/ErrorReport.types';
import type { LogSink } from '../data/logging/LogSink.types';
import { RingBufferSink } from '../data/logging/RingBufferSink';
import { SinkLogger } from '../data/logging/SinkLogger';
import { DeviceIntentSource } from './DeviceIntentSource';
import { Camera } from './engine/Camera';
import { KeyboardDevice } from './engine/input/KeyboardDevice';
import { MouseDevice } from './engine/input/MouseDevice';
import { RafFrameScheduler } from './engine/loop/RafFrameScheduler';
import { Canvas2dRenderer } from './engine/render/Canvas2dRenderer';
import type { SessionClock } from './engine/time/SessionClock.types';
import { InputMapper } from './input/InputMapper';
import { PRESETS } from './input/keybindings';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH, LOG_RING_CAPACITY } from './Match.constants';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { MatchHost } from './MatchHost';
import type { HostDocument, HostWindow } from './MatchHost.types';
import { withPlayerTeam } from './withPlayerTeam';
import type { SettingsController } from './settings/SettingsController';
import type { MatchFactory } from './SessionController.types';

/** What the browser match factory is built from; `main.tsx` passes window, document and the page singletons. */
export type BrowserMatchDeps = {
  /** The frame scheduler (`RafFrameScheduler`) is built on it, so the type names rAF. */
  readonly window: HostWindow & Pick<Window, 'requestAnimationFrame' | 'cancelAnimationFrame'>;
  readonly document: HostDocument;
  readonly gameConfig: GameConfig;
  readonly bus: TypedEventBus<BridgeEventMap>;
  /** The player's bindings when the match starts; later changes arrive as `settings` events. */
  readonly settings: Pick<SettingsController, 'bindings'>;
  /** Stamps the match's log records (the engine clock; core never reads time). */
  readonly clock: SessionClock;
  /**
   * The page's sinks for WARN and worse (the error reporter among them); each match adds its own
   * TRACE ring buffer.
   */
  readonly sinks: readonly LogSink[];
};

/**
 * A match's logger: everything to its own TRACE ring buffer first, so a report a page sink makes
 * already holds the record (ADR 0025 §3), then WARN and worse to the page's sinks.
 */
function createMatchLogger(deps: BrowserMatchDeps, ring: RingBufferSink): SinkLogger {
  return new SinkLogger(
    () => deps.clock.now(),
    [
      { sink: ring, minSeverity: SEVERITY.TRACE },
      ...deps.sinks.map((sink) => ({ sink, minSeverity: SEVERITY.WARN })),
    ],
  );
}

/** What an error report needs from the match (ADR 0025 §3, §4): it only reads the simulation. */
function readEvidence(simulation: Simulation, ring: RingBufferSink): MatchEvidence {
  const replay = simulation.exportReplay();
  return {
    match: { seed: replay.seed, tick: simulation.tick, ...simulation.recentContext(), replay },
    logTail: ring.tail(LOG_RING_CAPACITY),
  };
}

/**
 * The browser match factory `main.tsx` binds (13 §10; 13 §2's injected `createMatch`). Each call
 * builds the adapters (renderer, camera, devices, mapper, logger, frame scheduler), a fresh
 * `Simulation(setup.seed)` on `request.world`'s map and map objects with `request.roster` (the
 * setup's bots and the player's human slot) as its roster, the `Match` on the same world and its
 * `MatchHost`, then starts the host, which owns everything from then on. The match log records the seed first.
 * @throws What the renderer or `Match` threw, after destroying every adapter already built
 *   (0 listeners, 0 pending frames).
 */
export function createBrowserMatch(deps: BrowserMatchDeps): MatchFactory {
  return (request, viewport) => {
    const { window, gameConfig, settings } = deps;
    // Core spawns the roster's human slot, the player's Rover, at the team's Stronghold: a map
    // without one throws in `Simulation`, below.
    const config = withPlayerTeam(gameConfig, request.setup.playerTeam);
    const renderer = Canvas2dRenderer.fromCanvas(viewport.canvas);
    if (renderer === null) {
      throw new Error('This browser cannot draw on a 2D canvas.');
    }
    // The match points the camera at the player's Legend, so its start point does not matter.
    const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
    const ring = new RingBufferSink(LOG_RING_CAPACITY);
    const logger = createMatchLogger(deps, ring);
    const { seed } = request.setup;
    logger.log(makeLogRecord('INFO', 'client.match', 'Match seed', { attributes: { seed } }));
    const mapper = new InputMapper(settings.bindings ?? PRESETS.wasd);
    const keyboard = new KeyboardDevice((code) => mapper.isBound(code));
    const mouse = new MouseDevice();
    const input = new DeviceIntentSource([keyboard, mouse], mapper);
    let simulation: Simulation;
    let match: Match;
    try {
      simulation = new Simulation({
        config,
        seed,
        logger,
        map: request.world.map,
        mapObjects: request.world.mapObjects,
        roster: request.roster,
      });
      match = new Match({
        simulation,
        world: request.world,
        tickRate: gameConfig.tickRate,
        scheduler: new RafFrameScheduler(window),
        renderer,
        camera,
        input,
        logger,
        onCrash: request.onCrash,
        bridge: {
          bus: deps.bus,
          publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
          captureKinds: request.captureKinds,
        },
      });
    } catch (error) {
      // Nothing listens yet: release what was built, then let the session report it.
      renderer.destroy();
      camera.destroy();
      throw error;
    }
    const host = new MatchHost({
      match,
      viewport,
      window,
      document: deps.document,
      keyboard,
      mouse,
      input,
      bus: deps.bus,
      mapper,
      adapters: [renderer, camera],
      evidence: () => readEvidence(simulation, ring),
      currentTick: () => simulation.tick,
    });
    // A throw here has already been undone by the host (every listener, the match, the adapters).
    host.start();
    return host;
  };
}
