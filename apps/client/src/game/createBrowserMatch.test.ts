import {
  createDefaultGameConfig,
  type LogRecord,
  type RosterSlot,
  Simulation,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { matchResultFixture } from '../bridge/__fixtures__/matchResultFixtures';
import type { BridgeEventMap, RosterEntry } from '../bridge/events';
import type { PlayerHudSnapshot } from '../bridge/hud.types';
import { TypedEventBus } from '../bridge/TypedEventBus';
import type { LogSink } from '../data/logging/LogSink.types';
import { RingBufferSink } from '../data/logging/RingBufferSink';
import { shippedCatalogue } from './content/__fixtures__/shippedCatalogue';
import { createBrowserMatch } from './createBrowserMatch';
import { FakeSessionClock } from './engine/time/FakeSessionClock';
import { FakeBrowserTarget } from './FakeBrowserTarget';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import { MS_PER_SECOND } from './Match.constants';
import type { MatchObserver, PreparedWorld } from './Match.types';
import type { MatchViewport } from './MatchViewport.types';
import { prepareMatchWorld } from './prepareMatchWorld';
import type { MatchEvidence } from '../data/logging/ErrorReport.types';
import type { MatchRequest, RunningMatch } from './SessionController.types';
import { rosterSlots } from './session/rosterSlots';

const CONFIG = createDefaultGameConfig();
const SEED = 3;
/** The player's slot of the requests below: a dark Sentinel, the dark team's Rover. */
const PLAYER_SLOT: RosterSlot = {
  pilot: 'human',
  team: 'dark',
  definitionId: 'sentinel',
  role: 'rover',
};

/** The evidence of a local match, which always has some. */
function evidenceOf(running: RunningMatch): MatchEvidence {
  const evidence = running.evidence();
  if (evidence === null) throw new Error('A local match reports evidence');
  return evidence;
}

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
    observer: MatchObserver = { crashed: () => undefined, ended: () => undefined },
  ): MatchRequest => ({
    setup: { mode: 'local', seed: SEED, playerTeam: 'dark', allies: [], enemies: [] },
    world,
    captureKinds: ['capture-point', 'cathedral'],
    roster: [PLAYER_SLOT],
    observer,
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

  it('rethrows what the simulation threw and leaves nothing behind', () => {
    const { window, factory, viewport, request, listeners } = setUp();
    const world = prepareMatchWorld(CONFIG, SEED);
    const withoutDark = {
      ...world,
      map: { ...world.map, features: world.map.features.filter((f) => f.team !== 'dark') },
    };
    // Core spawns the dark human slot, a Rover, at the dark Stronghold, so the map without one throws.
    expect(() => factory(request(withoutDark), viewport)).toThrow(
      "The map has no dark Stronghold for the human's Legend.",
    );
    expect(listeners()).toBe(0);
    expect(window.pendingFrames).toBe(0);
  });

  it("hands a crash of the match's loop to the request's observer, with no frame left (DEC-106)", () => {
    const { window, factory, viewport, request } = setUp();
    const crashed = vi.fn<MatchObserver['crashed']>();
    const error = new Error('step failed');
    factory(request(undefined, { crashed, ended: () => undefined }), viewport);
    window.runFrame(0);
    window.runFrame(MS_PER_SECOND / CONFIG.tickRate);
    vi.spyOn(Simulation.prototype, 'step').mockImplementation(() => {
      throw error;
    });

    window.runFrame((2 * MS_PER_SECOND) / CONFIG.tickRate);

    expect(crashed.mock.calls).toEqual([[{ error, tick: 1 }]]);
    expect(window.pendingFrames).toBe(0);
  });

  it("tells the request's observer once, after the tick that ended the match", () => {
    const { window, factory, viewport, request } = setUp();
    const ended = vi.fn<MatchObserver['ended']>();
    const on = vi.spyOn(Simulation.prototype, 'on');
    factory(request(undefined, { crashed: () => undefined, ended }), viewport);
    const endMatch = on.mock.calls.find(([type]) => type === 'match-ended')?.[1];
    window.runFrame(0);

    endMatch?.({ result: matchResultFixture() });
    expect(ended).not.toHaveBeenCalled();
    window.runFrame(MS_PER_SECOND / CONFIG.tickRate);
    window.runFrame((2 * MS_PER_SECOND) / CONFIG.tickRate);

    expect(ended).toHaveBeenCalledTimes(1);
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

  it('links each capture point the HUD lists to its zone in the simulation (PR #64)', () => {
    const { bus, factory, viewport, request } = setUp();
    const published: BridgeEventMap['capture-state'][] = [];
    bus.on('capture-state', (event) => published.push(event));

    const running = factory(request(), viewport);
    const points = published.at(-1)?.points ?? [];
    running.destroy();

    expect(points.length).toBeGreaterThan(0);
    for (const point of points) {
      expect(point).toMatchObject({ ownerTeam: 'neutral', progress: 0 });
    }
  });

  it("gives the simulation's replay and history and the match's TRACE ring as evidence (ADR 0025 §3)", () => {
    // The human slot's ERROR comes while the match is built, before `evidence()` can be read, so
    // the ring is watched at its own `write`.
    const ringWrites = vi.spyOn(RingBufferSink.prototype, 'write');
    const atPageSink: { record: LogRecord; lastInRing: LogRecord | undefined }[] = [];
    const pageSink: LogSink = {
      write: (record) => {
        atPageSink.push({ record, lastInRing: ringWrites.mock.calls.at(-1)?.[0] });
      },
    };
    const { window, factory, viewport, request } = setUp(undefined, [pageSink]);
    // A class with no definition: core cannot spawn the human slot (ERROR core.match).
    const staleSlot: RosterSlot = { ...PLAYER_SLOT, definitionId: 'stale-class' };
    const stale: MatchRequest = { ...request(), roster: [staleSlot] };

    const running = factory(stale, viewport);
    window.runFrame(0);
    window.runFrame(MS_PER_SECOND / CONFIG.tickRate);
    const { match, logTail } = evidenceOf(running);

    expect(match.seed).toBe(SEED);
    expect(match.tick).toBe(1);
    expect(running.currentTick()).toBe(1);
    expect(match.replay.seed).toBe(SEED);
    // The human slot is roster setup, so the replay rebuilds it and queues no command for it; the
    // roster has no bots and the human slot has no Legend, so nothing else is queued either.
    expect(match.replay.roster).toEqual([staleSlot]);
    expect(match.replay.commands).toEqual([]);
    expect(match.recentCommands).toEqual([]);
    expect(match.replay.checkpoints.map(({ tick }) => tick)).toEqual([0]);
    expect(match.recentEvents.length).toBeGreaterThan(0);
    // The match seed first, then the human slot that did not spawn.
    expect(logTail.map(({ severityText, scope }) => [severityText, scope])).toEqual([
      ['INFO', 'client.match'],
      ['ERROR', 'core.match'],
    ]);
    expect(logTail[0]?.attributes).toEqual({ seed: SEED });
    // Only WARN and worse reach the page's sinks, after the ring already holds the record.
    expect(atPageSink.map(({ record }) => record)).toEqual([logTail[1]]);
    expect(atPageSink[0]?.lastInRing).toBe(atPageSink[0]?.record);
  });

  it("plays on the world's map with the request's roster, bots and human slot, as the simulation's (18 §8)", () => {
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
    const enemies = [bot(0, 'magus'), bot(1, 'warrior')];
    const withBots: MatchRequest = {
      ...base,
      setup: { ...base.setup, enemies },
      roster: [
        PLAYER_SLOT,
        ...rosterSlots({ allies: [], enemies }, shippedCatalogue().load().botRoster.difficulties),
      ],
    };

    const running = factory(withBots, viewport);
    const spawned = evidenceOf(running).match.recentEvents.flatMap((event) =>
      // The map's capture points (PR #64) spawn too; this test is about the roster.
      event.type === 'entity-spawned' && event.payload.kind !== 'capture-point'
        ? [[event.payload.kind, event.payload.team]]
        : [],
    );

    // Core spawns the lane bots first, then the Rovers at their Stronghold in roster order: the
    // human slot first, then the bot Rover.
    expect(spawned).toEqual([
      ['warrior', 'light'],
      ['sentinel', 'dark'],
      ['magus', 'light'],
    ]);
    running.destroy();
  });

  it("builds the simulation on the world's map objects, which its replay records", () => {
    const { factory, viewport, request } = setUp();
    const world = prepareMatchWorld(CONFIG, SEED);

    const running = factory(request(world), viewport);
    const { replay } = evidenceOf(running).match;

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
