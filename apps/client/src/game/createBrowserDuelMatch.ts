import { DeviceIntentSource } from './DeviceIntentSource';
import { RingBufferSink } from '../data/logging/RingBufferSink';
import { type BrowserMatchDeps, createMatchLogger } from './createBrowserMatch';
import { RemoteIntentSender } from './duel/RemoteIntentSender';
import { NEUTRAL_INTENT } from './duel/RemoteIntentSender.constants';
import { RemoteSimulation } from './duel/RemoteSimulation';
import { Camera } from './engine/Camera';
import { KeyboardDevice } from './engine/input/KeyboardDevice';
import { MouseDevice } from './engine/input/MouseDevice';
import { RafFrameScheduler } from './engine/loop/RafFrameScheduler';
import { Canvas2dRenderer } from './engine/render/Canvas2dRenderer';
import { InputMapper } from './input/InputMapper';
import { PRESETS } from './input/keybindings';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH, LOG_RING_CAPACITY } from './Match.constants';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { MatchHost } from './MatchHost';
import type { DuelMatchFactory } from './SessionController.types';

/**
 * The browser factory of an online Duel `main.tsx` binds (ADR 0016; the sibling of
 * `createBrowserMatch`). It builds the same adapters (renderer, camera, devices, mapper, logger,
 * frame scheduler), a `RemoteSimulation` over the started Duel's snapshots, and the `Match` with
 * `remote` set: the player's Legend is the one the server named and each tick sends the intent. The
 * `MatchHost` owns everything from then on. A Duel has no replay, so its `evidence` is `null`.
 * @throws What the renderer or `Match` threw, after destroying every adapter already built.
 */
export function createBrowserDuelMatch(deps: BrowserMatchDeps): DuelMatchFactory {
  return (request, viewport) => {
    const { window, gameConfig, settings } = deps;
    const { link } = request;
    const renderer = Canvas2dRenderer.fromCanvas(viewport.canvas);
    if (renderer === null) {
      throw new Error('This browser cannot draw on a 2D canvas.');
    }
    // The match points the camera at the player's Legend, so its start point does not matter.
    const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
    const logger = createMatchLogger(deps, new RingBufferSink(LOG_RING_CAPACITY));
    const mapper = new InputMapper(settings.bindings ?? PRESETS.wasd);
    const keyboard = new KeyboardDevice((code) => mapper.isBound(code));
    const mouse = new MouseDevice();
    const input = new DeviceIntentSource([keyboard, mouse], mapper);
    let simulation: RemoteSimulation;
    let match: Match;
    try {
      simulation = new RemoteSimulation(link, link.latestSnapshot());
      match = new Match({
        simulation,
        remote: {
          legendId: link.legendId,
          createActions: (projection) => new RemoteIntentSender(input, projection, link),
        },
        world: request.world,
        tickRate: gameConfig.tickRate,
        scheduler: new RafFrameScheduler(window),
        renderer,
        camera,
        input,
        logger,
        // A Duel casts no abilities yet (the server reads no `triggered` slots): no overlay to draw.
        abilities: [],
        onCrash: request.onCrash,
        bridge: {
          bus: deps.bus,
          publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
          captureKinds: request.captureKinds,
        },
      });
    } catch (error) {
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
      input: {
        // Pause, a lost focus and a hidden tab stop the ticks that would send the release, so the
        // server would keep walking the Legend: tell it now.
        releaseAll: () => {
          input.releaseAll();
          link.sendIntent(NEUTRAL_INTENT);
        },
      },
      bus: deps.bus,
      mapper,
      adapters: [renderer, camera],
      evidence: () => null,
      currentTick: () => simulation.tick,
    });
    host.start();
    return host;
  };
}
