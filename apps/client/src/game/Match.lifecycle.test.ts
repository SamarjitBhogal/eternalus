import {
  createDefaultGameConfig,
  type InputIntent,
  MemoryLogger,
  NullLogger,
  Simulation,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap, MatchClock } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH, MS_PER_SECOND } from './Match.constants';
import type { MatchDeps, PlayerChoice, PreparedWorld } from './Match.types';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';

const CONFIG = createDefaultGameConfig();
const TICK_MS = MS_PER_SECOND / CONFIG.tickRate;
const STILL: InputIntent = { move: { x: 0, y: 0 }, aim: null, triggered: [] };
const PLAYER: PlayerChoice = { legend: 'magus', team: 'dark' };
const WARRIOR: PlayerChoice = { legend: 'warrior', team: 'light' };

/** Freezes `value` and everything inside it, so any write to the world throws. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/**
 * What a test match on `world` is built from. Its `match-clock` publishes go to `clocks`, `on`
 * watches its simulation subscriptions and `unsubscribes` counts the ones it dropped.
 */
function matchDeps(world: PreparedWorld = prepareMatchWorld(CONFIG, 1)) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const clocks: MatchClock[] = [];
  bus.on('match-clock', (clock) => clocks.push(clock));
  const simulation = new Simulation({ config: CONFIG, seed: 1, logger: new NullLogger() });
  const unsubscribes = { count: 0 };
  const subscribe = simulation.on.bind(simulation);
  const on = vi.spyOn(simulation, 'on').mockImplementation((type, handler) => {
    const unsubscribe = subscribe(type, handler);
    return () => {
      unsubscribes.count += 1;
      unsubscribe();
    };
  });
  const deps = {
    simulation,
    world,
    tickRate: CONFIG.tickRate,
    scheduler: new FakeFrameScheduler(),
    renderer: new RecordingRenderer(),
    camera: new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT),
    input: { read: () => STILL },
    player: PLAYER,
    logger: new NullLogger(),
    onCrash: vi.fn<MatchDeps['onCrash']>(),
    bridge: { bus, publishEveryTicks: HUD_PUBLISH_EVERY_TICKS, captureKinds: [] },
  };
  return { deps, clocks, on, unsubscribes };
}

/** A match on `world`, sized to a 1280 × 720 canvas. */
function build(world?: PreparedWorld) {
  const { deps, clocks, unsubscribes } = matchDeps(world);
  const match = new Match(deps);
  match.resize(1280, 720, 1);
  return { match, simulation: deps.simulation, scheduler: deps.scheduler, clocks, unsubscribes };
}

describe('Match lifecycle', () => {
  it('refuses a map without a stronghold for the player team', () => {
    const world = prepareMatchWorld(CONFIG, 1);
    const { map } = world;
    const withoutLight = {
      ...map,
      features: map.features.filter((feature) => feature.team !== 'light'),
    };
    const { deps, on } = matchDeps({ ...world, map: withoutLight });

    expect(() => new Match({ ...deps, player: WARRIOR })).toThrow(
      `Map "${map.id}" has no light stronghold`,
    );
    expect(on).not.toHaveBeenCalled();
  });

  it('logs ERROR client.match naming the class id and the reason when the player cannot spawn', () => {
    const logger = new MemoryLogger();
    const stale: PlayerChoice = { legend: 'stale-class', team: 'dark' };
    const match = new Match({ ...matchDeps().deps, logger, player: stale });

    match.tick();

    const errors = logger.records.filter((record) => record.severityText === 'ERROR');
    expect(errors.map(({ scope, attributes }) => [scope, attributes])).toEqual([
      ['client.match', { classId: 'stale-class', reason: 'unknown-kind' }],
    ]);
    expect(errors[0]?.body).toContain('"stale-class"');
    expect(errors[0]?.body).toContain('unknown-kind');
    expect(match.playerEntityId).toBeNull();
  });

  it('logs no error when the player spawns, nor for a rejected command that is not its spawn', () => {
    const logger = new MemoryLogger();
    const { deps } = matchDeps();
    const match = new Match({ ...deps, logger });
    deps.simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'stale-class',
      definitionId: 'stale-class',
      team: 'dark',
      at: { x: 0, y: 0 },
      count: 1,
    });

    match.tick();

    expect(match.playerEntityId).not.toBeNull();
    expect(logger.records.filter((record) => record.severityText === 'ERROR')).toEqual([]);
  });

  it('hands a throw from a tick to onCrash with the tick, and its loop stops (DEC-106)', () => {
    const { deps } = matchDeps();
    const match = new Match(deps);
    const error = new Error('step failed');
    match.start();
    deps.scheduler.advance(0);
    deps.scheduler.advance(TICK_MS);
    vi.spyOn(deps.simulation, 'step').mockImplementation(() => {
      throw error;
    });

    deps.scheduler.advance(TICK_MS);

    expect(deps.onCrash.mock.calls).toEqual([[{ error, tick: 1 }]]);
    expect(deps.scheduler.hasPendingFrame).toBe(false);
  });

  it('runs whole ticks from the loop: 100 ms of frames is 3 ticks', () => {
    const { match, simulation, scheduler } = build();
    match.start();
    scheduler.advance(0);

    scheduler.runFrames(5, 20);

    expect(simulation.tick).toBe(3);
  });

  it('publishes once before the first frame, then on the bridge cadence', () => {
    const { match, simulation, scheduler, clocks } = build();
    match.start();
    expect(clocks).toEqual([{ tick: 0, seconds: 0 }]);

    scheduler.advance(0);
    scheduler.runFrames(30, TICK_MS);

    expect(simulation.tick).toBe(30);
    expect(clocks.map((clock) => clock.tick)).toEqual([0, 6, 12, 18, 24, 30]);
  });

  it('plays the same way twice for the same seed and intents (deterministic)', () => {
    const play = (): number => {
      let move = { x: 1, y: 0 };
      const input = { read: (): InputIntent => ({ move, aim: null, triggered: [] }) };
      const match = new Match({ ...matchDeps().deps, input, player: WARRIOR });
      match.resize(1280, 720, 1);
      for (let tick = 0; tick < 300; tick += 1) {
        move = tick < 150 ? { x: 1, y: 0 } : { x: 0, y: 1 };
        match.tick();
      }
      const player = match.snapshot.entities.find((entity) => entity.id === match.playerEntityId);
      return player?.transform?.x ?? Number.NaN;
    };

    expect(play()).toBe(play());
  });

  it('runs two matches on one frozen world, each with its own player Legend', () => {
    const world = deepFreeze(prepareMatchWorld(CONFIG, 1));
    for (const { match, scheduler } of [build(world), build(world)]) {
      match.start();
      scheduler.advance(0);
      scheduler.runFrames(10, TICK_MS);
      const legends = match.snapshot.entities.filter(
        (entity) => entity.family === 'legend' && entity.team === 'dark',
      );
      expect(legends.map((entity) => entity.kind)).toEqual(['magus']);
      match.destroy();
    }
  });

  it('pauses without simulating the paused time, then ticks again', () => {
    const { match, simulation, scheduler } = build();
    match.start();
    scheduler.advance(0);
    scheduler.runFrames(3, TICK_MS);
    expect(simulation.tick).toBe(3);

    match.setPaused(true);
    expect(scheduler.hasPendingFrame).toBe(false);
    scheduler.runFrames(30, TICK_MS);
    expect(simulation.tick).toBe(3);

    match.setPaused(false);
    expect(scheduler.hasPendingFrame).toBe(true);
    scheduler.advance(5 * MS_PER_SECOND);
    expect(simulation.tick).toBe(3);
    scheduler.runFrames(3, TICK_MS);
    expect(simulation.tick).toBe(6);
  });

  it('stops the loop and its subscriptions on destroy: 0 scheduled frames, 0 listeners', () => {
    const { match, scheduler, simulation, unsubscribes } = build();
    match.start();

    match.destroy();
    scheduler.advance(1000);

    expect(scheduler.hasPendingFrame).toBe(false);
    expect(simulation.tick).toBe(0);
    // Both of its subscriptions: the player's spawn and its rejection.
    expect(unsubscribes.count).toBe(2);
  });
});
