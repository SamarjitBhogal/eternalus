import {
  type Command,
  createDefaultGameConfig,
  type MapFeature,
  type MapFeatureKind,
  NullLogger,
  Simulation,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { BridgeEventMap } from '../bridge/events';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { withPlayer } from './__fixtures__/withPlayer';
import { DeveloperMenuController } from './DeveloperMenuController';
import { DEVELOPER_MOBS } from './DeveloperMenuController.constants';
import { prepareMatchWorld } from './prepareMatchWorld';

const SPAWN: Command<'dev-spawn-mobs'> = {
  type: 'dev-spawn-mobs',
  team: 'light',
  definitionId: 'light-minion',
  count: 3,
  origin: { kind: 'structure', structureId: 'any' },
};
const ADD_LEGEND: Command<'dev-spawn-legend'> = {
  type: 'dev-spawn-legend',
  team: 'dark',
  definitionId: 'warrior',
};
const REMOVE: Command<'dev-remove-entity'> = { type: 'dev-remove-entity', entityId: 'e1' };

const feature = (id: string, kind: MapFeatureKind, laneId?: string): MapFeature => ({
  id,
  kind,
  team: 'light',
  definitionId: kind,
  position: { x: 0, y: 0 },
  minimapGlyph: { shape: 'dot', size: 1, colourRole: 'team' },
  ...(laneId === undefined ? {} : { laneId }),
});

function setUp(isEnabled: boolean) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const enqueueCommand = vi.fn<Simulation['enqueueCommand']>();
  const states: BridgeEventMap['developer-menu'][] = [];
  bus.on('developer-menu', (state) => states.push(state));
  const controller = new DeveloperMenuController({
    isEnabled,
    simulation: { enqueueCommand },
    bus,
    map: { features: [feature('gate-a', 'gate', 'lane-1'), feature('camp-a', 'camp')] },
    humanLegendId: () => 'entity-1',
  });
  return { bus, enqueueCommand, states, controller };
}

describe('DeveloperMenuController', () => {
  it('enqueues exactly one command per dev-command intent while enabled', () => {
    const { bus, enqueueCommand } = setUp(true);
    bus.emit('ui-intent', { kind: 'dev-command', command: SPAWN });
    bus.emit('ui-intent', { kind: 'dev-command', command: ADD_LEGEND });
    bus.emit('ui-intent', { kind: 'dev-command', command: REMOVE });
    expect(enqueueCommand.mock.calls).toEqual([[SPAWN], [ADD_LEGEND], [REMOVE]]);
  });

  it('ignores a dev-command while the menu is not enabled', () => {
    const { bus, enqueueCommand } = setUp(false);
    bus.emit('ui-intent', { kind: 'dev-command', command: SPAWN });
    expect(enqueueCommand).not.toHaveBeenCalled();
  });

  it('ignores other intents and stops listening when destroyed', () => {
    const { bus, enqueueCommand, controller } = setUp(true);
    bus.emit('ui-intent', { kind: 'start-match' });
    controller.destroy();
    bus.emit('ui-intent', { kind: 'dev-command', command: SPAWN });
    expect(enqueueCommand).not.toHaveBeenCalled();
  });

  it('toggles open and closed, publishing the mobs and only the structures on a lane', () => {
    const { controller, states } = setUp(true);
    controller.toggle();
    controller.toggle();
    expect(states.map((state) => state.isOpen)).toEqual([true, false]);
    expect(states[0]?.mobs).toEqual(DEVELOPER_MOBS);
    expect(states[0]?.origins).toEqual([{ id: 'gate-a', label: 'gate-a (gate)' }]);
  });

  it('does not open, and publishes nothing, while the menu is not enabled', () => {
    const { controller, states } = setUp(false);
    controller.toggle();
    expect(states).toEqual([]);
  });

  it('offers mobs and origins the real simulation accepts', () => {
    const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
    const { map } = prepareMatchWorld(config, 1);
    const simulation = new Simulation({
      seed: 1,
      logger: new NullLogger(),
      ...withPlayer(config, { legend: 'warrior', team: 'light' }),
      map,
    });
    const bus = new TypedEventBus<BridgeEventMap>();
    const controller = new DeveloperMenuController({
      isEnabled: true,
      simulation,
      bus,
      map,
      humanLegendId: () => null,
    });
    const states: BridgeEventMap['developer-menu'][] = [];
    bus.on('developer-menu', (state) => states.push(state));
    controller.publish();
    const origin = states[0]?.origins[0];
    expect(origin).toBeDefined();
    const rejected: string[] = [];
    simulation.on('command-rejected', ({ reason }) => rejected.push(reason));
    for (const { id } of DEVELOPER_MOBS) {
      bus.emit('ui-intent', {
        kind: 'dev-command',
        command: {
          type: 'dev-spawn-mobs',
          team: 'dark',
          definitionId: id,
          count: 1,
          origin: { kind: 'structure', structureId: origin?.id ?? '' },
        },
      });
    }
    simulation.step();
    expect(rejected).toEqual([]);
  });

  it('adds a Legend to a real simulation and refuses the one past the team cap', () => {
    const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
    const { map } = prepareMatchWorld(config, 1);
    const simulation = new Simulation({
      seed: 1,
      logger: new NullLogger(),
      ...withPlayer(config, { legend: 'warrior', team: 'light' }),
      map,
    });
    const bus = new TypedEventBus<BridgeEventMap>();
    new DeveloperMenuController({
      isEnabled: true,
      simulation,
      bus,
      map,
      humanLegendId: () => null,
    });
    const rejected: string[] = [];
    simulation.on('command-rejected', ({ reason }) => rejected.push(reason));
    const legends = () =>
      simulation
        .snapshot()
        .entities.filter(({ kind, team }) => kind === 'warrior' && team === 'dark');
    for (let sent = 0; sent <= config.limits.maxLegendsPerTeam; sent += 1) {
      bus.emit('ui-intent', { kind: 'dev-command', command: ADD_LEGEND });
    }
    simulation.step();
    expect(legends()).toHaveLength(config.limits.maxLegendsPerTeam);
    expect(rejected).toEqual(['cap-exceeded']);
  });
});
