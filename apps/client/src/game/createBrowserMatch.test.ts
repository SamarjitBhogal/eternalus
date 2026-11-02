import { createDefaultGameConfig, type LogRecord, Simulation } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap, RosterEntry } from '../bridge/events';
import type { PlayerHudSnapshot } from '../bridge/hud.types';
import { TypedEventBus } from '../bridge/TypedEventBus';
import type { LogSink } from '../data/logging/LogSink.types';
import { createBrowserMatch } from './createBrowserMatch';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { FakeBrowserTarget } from './FakeBrowserTarget';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { MS_PER_SECOND } from './Match.constants';
import type { PreparedWorld } from './Match.types';
import type { MatchViewport } from './MatchViewport.types';
import { prepareMatchWorld } from './prepareMatchWorld';
import type { MatchRequest, RunningMatch } from './SessionController.types';

const CONFIG = createDefaultGameConfig();
const SEED = 3;

function setUp(canvas = new FakeViewportCanvas(), sinks: readonly LogSink[] = []) {
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
    sinks,
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

  it("gives the simulation's replay and history and the match's TRACE ring as evidence (ADR 0025 §3)", () => {
    let running: RunningMatch | null = null;
    const atPageSink: { record: LogRecord; lastInRing: LogRecord | undefined }[] = [];
    const pageSink: LogSink = {
      write: (record) => {
        atPageSink.push({ record, lastInRing: running?.evidence().logTail.at(-1) });
      },
    };
    const { window, factory, viewport, request } = setUp(undefined, [pageSink]);
    // A class with no definition: the spawn is rejected (INFO core.commands, ERROR client.match).
    const stale: MatchRequest = { ...request(), player: { legend: 'stale-class', team: 'dark' } };

    running = factory(stale, viewport);
    window.runFrame(0);
    window.runFrame(MS_PER_SECOND / CONFIG.tickRate);
    const { match, logTail } = running.evidence();

    expect(match.seed).toBe(SEED);
    expect(match.tick).toBe(1);
    expect(running.currentTick()).toBe(1);
    expect(match.replay.seed).toBe(SEED);
    // The player's spawn, before tick 1; the setup has no bots.
    expect(
      match.replay.commands.map(({ tick, command }) => [
        tick,
        command.type === 'dev-spawn' ? command.kind : command.type,
      ]),
    ).toContainEqual([0, 'stale-class']);
    expect(match.recentCommands.map(({ command }) => command)).toEqual(
      match.replay.commands.map(({ command }) => command),
    );
    expect(match.replay.checkpoints.map(({ tick }) => tick)).toEqual([0]);
    expect(match.recentEvents.length).toBeGreaterThan(0);
    // The match seed first, then the rejected spawn.
    expect(logTail.map(({ severityText, scope }) => [severityText, scope])).toEqual([
      ['INFO', 'client.match'],
      ['INFO', 'core.commands'],
      ['ERROR', 'client.match'],
    ]);
    expect(logTail[0]?.attributes).toEqual({ seed: SEED });
    // Only WARN and worse reach the page's sinks, after the ring already holds the record.
    expect(atPageSink.map(({ record }) => record)).toEqual([logTail[2]]);
    expect(atPageSink[0]?.lastInRing).toBe(atPageSink[0]?.record);
  });

  it("plays on the world's map with the setup's bots as the simulation's roster (18 §8)", () => {
    const { factory, viewport, request } = setUp();
    const bot = (index: number, classId: 'magus' | 'warrior'): RosterEntry => ({
      legendId: `light-${String(index + 1)}`,
      displayName: `Bot ${String(index + 1)}`,
      classId,
      specId: null,
      isBot: true,
      isPlayer: false,
      isRover: index === 0,
      team: 'light',
    });
    const base = request();
    const withBots: MatchRequest = {
      ...base,
      setup: { ...base.setup, enemies: [bot(0, 'magus'), bot(1, 'warrior')] },
    };

    const running = factory(withBots, viewport);
    const spawned = running
      .evidence()
      .match.recentEvents.flatMap((event) =>
        event.type === 'entity-spawned' ? [[event.payload.kind, event.payload.team]] : [],
      );

    // Core spawns the lane bots first, then the Rovers at their Stronghold.
    expect(spawned).toEqual([
      ['warrior', 'light'],
      ['magus', 'light'],
    ]);
    running.destroy();
  });

  it("builds the simulation on the world's map objects, which its replay records", () => {
    const { factory, viewport, request } = setUp();
    const world = prepareMatchWorld(CONFIG, SEED);

    const running = factory(request(world), viewport);
    const { replay } = running.evidence().match;

    expect(world.mapObjects.length).toBeGreaterThan(0);
    expect(replay.mapObjects).toEqual(world.mapObjects);
    running.destroy();
  });

  it('draws the minimap every frame, with the developer explorer hidden or shown (DEC-143)', () => {
    for (const isExplorerShown of [false, true]) {
      // The minimap is the only drawing that clips (to the HUD ring, `clipToEllipse`).
      let clips = 0;
      const canvas = new FakeViewportCanvas(1280, 720, {
        ...FakeViewportCanvas.silentContext(),
        clip: () => {
          clips += 1;
        },
      });
      const { window, factory, viewport, request } = setUp(canvas);
      const running = factory(request(), { ...viewport, isExplorerShown });

      window.runFrame(0);
      window.runFrame(MS_PER_SECOND / CONFIG.tickRate);

      expect({ isExplorerShown, clips }).toEqual({ isExplorerShown, clips: 2 });
      running.destroy();
    }
  });
});
