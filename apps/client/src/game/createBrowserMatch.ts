import {
  type GameConfig,
  type LegendClassId,
  makeLogRecord,
  SEVERITY,
  Simulation,
} from '@eternalus/core';

import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import type { MatchEvidence } from '../data/logging/ErrorReport.types';
import type { LogSink } from '../data/logging/LogSink.types';
import { RingBufferSink } from '../data/logging/RingBufferSink';
import { SinkLogger } from '../data/logging/SinkLogger';
import type { ResourceController } from '../data/resources/ResourceController';
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
import { followViewFor } from './followViewFor';
import { LOG_RING_CAPACITY } from './Match.constants';
import { matchLegendSheets } from './matchLegendSheets';
import { matchAssetGroups } from './session/matchAssetGroups';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { MatchHost } from './MatchHost';
import type { HostDocument, HostWindow } from './MatchHost.types';
import { withPlayerTeam } from './withPlayerTeam';
import type { SettingsController } from './settings/SettingsController';
import type { MatchFactory } from './SessionController.types';

/** What the browser match factory is built from; `main.tsx` passes window, document and the page singletons. */
export type BrowserMatchDeps = {
  /**
   * The loaded sprite atlases: `match-loading` loaded the sheet group of every Legend in the
   * rosters before the match (13 §2), and the factory hands their atlases to the renderer. Left
   * out (the Duel factory, tests), the renderer gets none and every Legend is a disc.
   */
  readonly resources?: Pick<ResourceController, 'atlases'>;
  /** The frame scheduler (`RafFrameScheduler`) is built on it, so the type names rAF. */
  readonly window: HostWindow & Pick<Window, 'requestAnimationFrame' | 'cancelAnimationFrame'>;
  readonly document: HostDocument;
  readonly gameConfig: GameConfig;
  /**
   * Each Legend class's sprite width by class id (core content `spriteWidth`, DEC-424;
   * `legendSpriteWidthsOf`): the sprites' widths and the player's camera.
   */
  readonly legendSpriteWidths: Readonly<Record<LegendClassId, number>>;
  /** `?dev=1` (13 §4): the developer menu exists in every match this factory builds. */
  readonly isDeveloperMenuEnabled?: boolean;
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
export function createMatchLogger(deps: BrowserMatchDeps, ring: RingBufferSink): SinkLogger {
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
 * `MatchHost`, then starts the host, which owns everything from then on. The renderer gets the
 * atlases of every Legend's sprite sheet (`matchLegendSheets`), which `match-loading` loaded and
 * the session releases (13 §2), and the `Match` gets the sheets (DEC-378 (2)) and each class's
 * sprite width; the camera's view zooms out with the player's own sprite width (DEC-424). The match log
 * records the seed first.
 * @throws What the renderer or `Match` threw, after destroying every adapter already built
 *   (0 listeners, 0 pending frames).
 */
export function createBrowserMatch(deps: BrowserMatchDeps): MatchFactory {
  return (request, viewport) => {
    const { window, gameConfig, settings, resources, legendSpriteWidths } = deps;
    const legendSheets = matchLegendSheets(request.setup);
    // Core spawns the roster's human slot, the player's Rover, at the team's Stronghold: a map
    // without one throws in `Simulation`, below.
    const config = withPlayerTeam(gameConfig, request.setup.playerTeam);
    // The groups `match-loading` loaded; only the sprite sheet groups hold atlases.
    const atlases = Object.fromEntries(
      matchAssetGroups(request.setup).flatMap((group) =>
        Object.entries(resources?.atlases(group) ?? {}),
      ),
    );
    const renderer = Canvas2dRenderer.fromCanvas(viewport.canvas, atlases);
    if (renderer === null) {
      throw new Error('This browser cannot draw on a 2D canvas.');
    }
    // The match points the camera at the player's Legend, so its start point does not matter. The
    // view zooms out with the player's own sprite width (DEC-424).
    const player = request.setup.allies.find(({ isPlayer }) => isPlayer);
    const view = followViewFor(
      player === undefined ? undefined : legendSpriteWidths[player.classId],
    );
    const camera = new Camera({ x: 0, y: 0 }, view.width, view.height);
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
        legendSheets,
        legendSpriteWidths,
        simulation,
        world: request.world,
        tickRate: gameConfig.tickRate,
        scheduler: new RafFrameScheduler(window),
        renderer,
        camera,
        input,
        logger,
        observer: request.observer,
        isDeveloperMenuEnabled: deps.isDeveloperMenuEnabled === true,
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
