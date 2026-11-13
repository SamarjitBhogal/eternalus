import { createDefaultGameConfig, type InputIntent, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { withPlayer } from './__fixtures__/withPlayer';
import { Camera } from './engine/Camera';
import { FakeFrameScheduler } from './engine/loop/FakeFrameScheduler';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { Match } from './Match';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import { HUD_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import { prepareMatchWorld } from './prepareMatchWorld';

const IDLE: InputIntent = { move: { x: 0, y: 0 }, aim: null, triggered: [] };

/** A match on seed 1 with the developer menu on or off; `enqueueCommand` is spied on. */
const setUp = (isDeveloperMenuEnabled: boolean) => {
  const config = createDefaultGameConfig();
  const world = prepareMatchWorld(config, 1);
  const simulation = new Simulation({
    ...withPlayer(config, { legend: 'warrior', team: 'light' }),
    seed: 1,
    logger: new NullLogger(),
    map: world.map,
  });
  const enqueue = vi.spyOn(simulation, 'enqueueCommand');
  const bus = new TypedEventBus<BridgeEventMap>();
  const states: BridgeEventMap['developer-menu'][] = [];
  bus.on('developer-menu', (state) => states.push(state));
  const match = new Match({
    simulation,
    world,
    tickRate: config.tickRate,
    scheduler: new FakeFrameScheduler(),
    renderer: new RecordingRenderer(),
    camera: new Camera({ x: 0, y: 0 }, FOLLOW_VIEW_WIDTH, FOLLOW_VIEW_HEIGHT),
    input: { read: () => IDLE },
    logger: new NullLogger(),
    onCrash: () => undefined,
    isDeveloperMenuEnabled,
    bridge: { bus, publishEveryTicks: HUD_PUBLISH_EVERY_TICKS, captureKinds: [] },
  });
  return { match, bus, enqueue, states, world };
};

describe('Match developer menu', () => {
  it('publishes the menu on start with the structures of the map the horde can start at', () => {
    const { match, states, world } = setUp(true);
    match.start();
    const laneStructures = world.map.features.filter(({ laneId }) => laneId !== undefined);
    expect(states[0]?.isOpen).toBe(false);
    expect(laneStructures.length).toBeGreaterThan(0);
    expect(states[0]?.origins.map(({ id }) => id)).toEqual(laneStructures.map(({ id }) => id));
    match.destroy();
  });

  it('enqueues one command per dev-command intent while enabled', () => {
    const { match, bus, enqueue } = setUp(true);
    bus.emit('ui-intent', {
      kind: 'dev-command',
      command: { type: 'dev-remove-entity', entityId: 'e1' },
    });
    expect(enqueue.mock.calls).toEqual([[{ type: 'dev-remove-entity', entityId: 'e1' }]]);
    match.destroy();
  });

  it('ignores a dev-command while the menu is disabled', () => {
    const { match, bus, enqueue } = setUp(false);
    bus.emit('ui-intent', {
      kind: 'dev-command',
      command: { type: 'dev-remove-entity', entityId: 'e1' },
    });
    expect(enqueue).not.toHaveBeenCalled();
    match.destroy();
  });

  it('stops listening once the match is destroyed', () => {
    const { match, bus, enqueue } = setUp(true);
    match.destroy();
    bus.emit('ui-intent', {
      kind: 'dev-command',
      command: { type: 'dev-remove-entity', entityId: 'e1' },
    });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('keeps running with no human (sim mode): the menu is told, nothing follows or crashes', () => {
    const { match, bus, states } = setUp(true);
    match.start();
    const human = match.playerEntityId;
    expect(states.at(-1)?.humanLegendId).toBe(human);
    expect(human).not.toBeNull();

    bus.emit('ui-intent', {
      kind: 'dev-command',
      command: { type: 'dev-set-controller', entityId: human ?? '', controllerId: 'rover' },
    });
    match.tick();
    match.tick();
    match.render(0);

    expect(match.playerEntityId).toBeNull();
    expect(states.at(-1)?.humanLegendId).toBeNull();
    match.destroy();
  });
});
