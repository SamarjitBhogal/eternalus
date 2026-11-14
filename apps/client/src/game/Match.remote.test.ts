import { createDefaultGameConfig, MemoryLogger, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { withPlayer } from './__fixtures__/withPlayer';
import { FakeDuelLink } from './duel/FakeDuelLink';
import { RemoteIntentSender } from './duel/RemoteIntentSender';
import { RemoteSimulation } from './duel/RemoteSimulation';
import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH, MS_PER_SECOND } from './Match.constants';
import type { IntentSource } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';

const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
const TICK_MS = MS_PER_SECOND / CONFIG.tickRate;

/**
 * A `Match` over a `RemoteSimulation`, the way `createBrowserDuelMatch` builds it. A real local
 * `Simulation` stands in for the server: its snapshots are what the link serves. The Duel's own
 * Legend is not the snapshot's human Legend but an enemy bot's, as in a Duel.
 */
function setUp() {
  const world = prepareMatchWorld(CONFIG, 1);
  const server = new Simulation({
    seed: 1,
    logger: new NullLogger(),
    ...withPlayer(CONFIG, { legend: 'warrior', team: 'light' }),
    map: world.map,
    mapObjects: world.mapObjects,
  });
  const first = server.snapshot();
  const ownLegend = first.entities.find(
    (entity) => entity.id !== first.match.humanLegendId && entity.transform !== null,
  );
  if (ownLegend === undefined) throw new Error('The fixture has no second entity');
  const link = new FakeDuelLink(ownLegend.id, first);
  const scripted: IntentSource = {
    read: () => ({ move: { x: 1, y: 0 }, aim: null, isAttacking: false, triggered: [] }),
  };
  const enqueue = vi.spyOn(server, 'enqueueCommand');
  const scheduler = new FakeFrameScheduler();
  const camera = new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT);
  const lookAt = vi.spyOn(camera, 'lookAt');
  const match = new Match({
    simulation: new RemoteSimulation(link, first),
    remote: {
      legendId: link.legendId,
      createActions: (projection) => new RemoteIntentSender(scripted, projection, link),
    },
    world,
    tickRate: CONFIG.tickRate,
    scheduler,
    renderer: new RecordingRenderer(),
    camera,
    input: scripted,
    logger: new MemoryLogger(),
    onCrash: () => undefined,
    bridge: {
      bus: new TypedEventBus<BridgeEventMap>(),
      publishEveryTicks: HUD_PUBLISH_EVERY_TICKS,
      captureKinds: [],
    },
  });
  match.resize(1280, 720, 1);
  const runTicks = (count: number): void => {
    for (let tick = 0; tick <= count; tick += 1) scheduler.advance(TICK_MS);
  };
  return { match, server, link, lookAt, ownLegend, enqueue, runTicks, first };
}

describe('Match over a remote simulation', () => {
  it("follows the Duel's Legend, not the snapshot's human Legend", () => {
    const { match, link, lookAt, ownLegend, first } = setUp();

    expect(match.playerEntityId).toBe(link.legendId);
    expect(match.playerEntityId).not.toBe(first.match.humanLegendId);
    expect(lookAt).toHaveBeenCalledWith(ownLegend.transform);
  });

  it('sends one intent per tick and queues no command', () => {
    const { match, link, enqueue, runTicks } = setUp();
    match.start();

    runTicks(3);

    expect(link.intents.length).toBeGreaterThanOrEqual(3);
    expect(link.intents[0]?.move).toEqual({ x: 1, y: 0 });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('draws the latest snapshot the server sent', () => {
    const { match, server, link, runTicks } = setUp();
    match.start();
    server.step();
    server.step();
    link.snapshot = server.snapshot();

    runTicks(2);

    expect(match.snapshot).toBe(link.snapshot);
  });
});
