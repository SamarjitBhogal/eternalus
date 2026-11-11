import { createDefaultGameConfig, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { withPlayer } from './__fixtures__/withPlayer';
import { createBrowserDuelMatch } from './createBrowserDuelMatch';
import { FakeDuelLink } from './duel/FakeDuelLink';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { FakeBrowserTarget } from './FakeBrowserTarget';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { MS_PER_SECOND } from './Match.constants';
import type { MatchViewport } from './MatchViewport.types';
import { prepareMatchWorld } from './prepareMatchWorld';
import type { DuelMatchRequest } from './SessionController.types';

const CONFIG = createDefaultGameConfig();

function setUp(canvas = new FakeViewportCanvas()) {
  const window = new FakeBrowserTarget();
  const document = new FakeBrowserTarget();
  const factory = createBrowserDuelMatch({
    window,
    document,
    gameConfig: CONFIG,
    bus: new TypedEventBus<BridgeEventMap>(),
    settings: { bindings: null },
    clock: new FakeSessionClock(),
    sinks: [],
  });
  const viewport: MatchViewport = {
    canvas,
    chrome: {
      onDeveloperRoofsChanged: () => undefined,
      onExplorerChanged: () => undefined,
      setOverview: () => undefined,
    },
    isExplorerShown: false,
  };
  const world = prepareMatchWorld(CONFIG, 1);
  const snapshot = new Simulation({
    seed: 1,
    logger: new NullLogger(),
    ...withPlayer(CONFIG, { legend: 'warrior', team: 'light' }),
    map: world.map,
    mapObjects: world.mapObjects,
  }).snapshot();
  const link = new FakeDuelLink(snapshot.match.humanLegendId ?? 'none', snapshot);
  const request: DuelMatchRequest = {
    world,
    captureKinds: ['capture-point', 'cathedral'],
    link,
    onCrash: () => undefined,
  };
  const listeners = (): number =>
    window.listenerCount() + document.listenerCount() + canvas.listenerCount();
  return { window, factory, viewport, request, link, listeners };
}

describe('createBrowserDuelMatch', () => {
  it('throws for a canvas without a 2D context and leaves nothing behind', () => {
    const { window, factory, viewport, request, listeners } = setUp(
      new FakeViewportCanvas(1280, 720, null),
    );

    expect(() => factory(request, viewport)).toThrow('cannot draw on a 2D canvas');

    expect(listeners()).toBe(0);
    expect(window.pendingFrames).toBe(0);
  });

  it('sends an intent per tick on the browser frames, reports no evidence and cleans up', () => {
    const { window, factory, viewport, request, link, listeners } = setUp();

    const running = factory(request, viewport);
    for (let frame = 0; frame <= 3; frame += 1) {
      window.runFrame((frame * MS_PER_SECOND) / CONFIG.tickRate);
    }

    expect(link.intents.length).toBeGreaterThanOrEqual(3);
    expect(running.evidence()).toBeNull();
    running.destroy();
    expect(listeners()).toBe(0);
    expect(window.pendingFrames).toBe(0);
  });
});
