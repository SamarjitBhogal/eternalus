import { createDefaultGameConfig, Simulation } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import type { PlayerHudSnapshot } from '../bridge/hud.types';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { createBrowserMatch } from './createBrowserMatch';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { FakeBrowserTarget } from './FakeBrowserTarget';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { MS_PER_SECOND } from './Match.constants';
import type { PreparedWorld } from './Match.types';
import type { MatchViewport } from './MatchViewport.types';
import { prepareMatchWorld } from './prepareMatchWorld';
import type { MatchRequest } from './SessionController.types';

const CONFIG = createDefaultGameConfig();
const SEED = 3;

function setUp(canvas = new FakeViewportCanvas()) {
  const window = new FakeBrowserTarget();
  const document = new FakeBrowserTarget();
  const bus = new TypedEventBus<BridgeEventMap>();
  const factory = createBrowserMatch({
    window,
    document,
    gameConfig: CONFIG,
    bus,
    settings: { bindings: null },
    clock: new FakeSessionClock(),
    sinks: [],
  });
  const viewport: MatchViewport = {
    canvas,
    chrome: {
      onInteriorChanged: () => undefined,
      onExplorerChanged: () => undefined,
      setLeaveInterior: () => undefined,
      setOverview: () => undefined,
    },
    isExplorerShown: false,
  };
  const request = (
    world: PreparedWorld = prepareMatchWorld(CONFIG, SEED),
    onCrash: MatchRequest['onCrash'] = () => undefined,
  ): MatchRequest => ({
    setup: { seed: SEED, playerTeam: 'dark', allies: [], enemies: [] },
    player: { legend: 'sentinel', team: 'dark' },
    world,
    captureKinds: ['capture-point', 'cathedral'],
    onCrash,
  });
  /** Every listener on the window, the document and the canvas. */
  const listeners = (): number =>
    window.listenerCount() + document.listenerCount() + canvas.listenerCount();
  return { window, bus, factory, viewport, request, listeners };
}

describe('createBrowserMatch', () => {
  it('throws for a canvas without a 2D context and leaves nothing behind', () => {
    const { window, factory, viewport, request, listeners } = setUp(
      new FakeViewportCanvas(1280, 720, null),
    );
    expect(() => factory(request(), viewport)).toThrow('cannot draw on a 2D canvas');
    expect(listeners()).toBe(0);
    expect(window.pendingFrames).toBe(0);
  });

  it('rethrows what Match threw and leaves nothing behind', () => {
    const { window, factory, viewport, request, listeners } = setUp();
    const world = prepareMatchWorld(CONFIG, SEED);
    const withoutDark = {
      ...world,
      map: { ...world.map, features: world.map.features.filter((f) => f.team !== 'dark') },
    };
    expect(() => factory(request(withoutDark), viewport)).toThrow('has no dark stronghold');
    expect(listeners()).toBe(0);
    expect(window.pendingFrames).toBe(0);
  });

  it("hands a crash of the match's loop to the request's onCrash, with no frame left (DEC-106)", () => {
    const { window, factory, viewport, request } = setUp();
    const onCrash = vi.fn<MatchRequest['onCrash']>();
    const error = new Error('step failed');
    factory(request(undefined, onCrash), viewport);
    window.runFrame(0);
    window.runFrame(MS_PER_SECOND / CONFIG.tickRate);
    vi.spyOn(Simulation.prototype, 'step').mockImplementation(() => {
      throw error;
    });

    window.runFrame((2 * MS_PER_SECOND) / CONFIG.tickRate);

    expect(onCrash.mock.calls).toEqual([[{ error, tick: 1 }]]);
    expect(window.pendingFrames).toBe(0);
  });

  it("runs the requested Legend on the browser's frames and leaves nothing behind on destroy", () => {
    const { window, bus, factory, viewport, request, listeners } = setUp();
    const busBefore = bus.listenerCount();
    const players: (PlayerHudSnapshot | null)[] = [];
    bus.on('hud-state', ({ player }) => players.push(player));

    const running = factory(request(), viewport);
    expect(window.pendingFrames).toBe(1);
    expect(listeners()).toBeGreaterThan(0);
    for (let frame = 0; frame <= 6; frame += 1) {
      window.runFrame((frame * MS_PER_SECOND) / CONFIG.tickRate);
    }

    expect(players.at(-1)?.definitionId).toBe('sentinel');
    running.destroy();
    expect(listeners()).toBe(0);
    expect(window.pendingFrames).toBe(0);
    expect(bus.listenerCount()).toBe(busBefore + 1);
  });
});
