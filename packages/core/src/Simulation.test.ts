import { describe, expect, it } from 'vitest';

import type { Command } from './commands/Command.types';
import { ConfigValidationError } from './config/ConfigValidationError';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { Logger } from './diagnostics/Logger.types';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { NullLogger } from './diagnostics/NullLogger';
import { Simulation } from './Simulation';
import type { System } from './systems/System.types';

const stop = (actorId: string): Command => ({ type: 'stop', actorId });

const simulation = (
  systems: readonly System[] = [],
  logger: Logger = new NullLogger(),
): Simulation => new Simulation(createDefaultGameConfig(), 1, logger, systems);

describe('Simulation', () => {
  it('advances exactly one tick per step and announces it', () => {
    const sim = simulation();
    const completed: number[] = [];
    sim.on('tick-completed', ({ tick }) => completed.push(tick));
    sim.step();
    sim.step();
    expect(sim.tick).toBe(2);
    expect(completed).toEqual([1, 2]);
    expect(sim.snapshot().tick).toBe(2);
  });

  it('applies queued commands first, then runs the systems in order', () => {
    const order: string[] = [];
    const system = (name: string): System => ({ name, update: () => order.push(name) });
    const sim = simulation([system('first'), system('second')]);
    sim.on('command-rejected', ({ command }) => order.push(`command ${command.type}`));
    sim.enqueueCommand(stop('entity-1'));
    sim.step();
    expect(order).toEqual(['command stop', 'first', 'second']);
  });

  it('applies a command in the next step only, once', () => {
    const sim = simulation();
    const appliedAt: number[] = [];
    sim.on('command-rejected', () => appliedAt.push(sim.tick));
    sim.enqueueCommand(stop('entity-1'));
    expect(appliedAt).toEqual([]);
    sim.step();
    sim.step();
    expect(appliedAt).toEqual([0]);
  });

  it('defers a command enqueued by a system to the following tick', () => {
    const appliedAt: number[] = [];
    const bot: System = {
      name: 'bot',
      update: ({ state }) => {
        if (state.tick === 0) {
          sim.enqueueCommand(stop('entity-1'));
        }
      },
    };
    const sim = simulation([bot]);
    sim.on('command-rejected', () => appliedAt.push(sim.tick));
    sim.step();
    sim.step();
    expect(appliedAt).toEqual([1]);
  });

  it('logs a rejected command with the tick and structured attributes', () => {
    const logger = new MemoryLogger();
    const sim = simulation([], logger);
    sim.step();
    sim.enqueueCommand({ type: 'dev-remove-entity', entityId: 'entity-9' });
    sim.step();
    expect(logger.records).toEqual([
      {
        severityNumber: 9,
        severityText: 'INFO',
        body: 'Rejected dev-remove-entity: unknown-entity',
        scope: 'core.commands',
        eventName: 'command-rejected',
        tick: 1,
        attributes: { commandType: 'dev-remove-entity', reason: 'unknown-entity' },
      },
    ]);
  });

  it('rejects dev-spawn of a kind no registry knows yet', () => {
    const sim = simulation();
    const reasons: string[] = [];
    sim.on('command-rejected', ({ reason }) => reasons.push(reason));
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: { x: 0, y: 0 },
      count: 1,
    });
    sim.step();
    expect(reasons).toEqual(['unknown-kind']);
    expect(sim.snapshot().entities).toEqual([]);
  });

  it('stops delivering events after unsubscribe', () => {
    const sim = simulation();
    const completed: number[] = [];
    const unsubscribe = sim.on('tick-completed', ({ tick }) => completed.push(tick));
    sim.step();
    unsubscribe();
    sim.step();
    expect(completed).toEqual([1]);
  });

  it('hashes equal runs equal and a different seed differently', () => {
    const run = (seed: number): number => {
      const sim = new Simulation(createDefaultGameConfig(), seed, new NullLogger(), [
        { name: 'draw', update: ({ state }) => state.rng.nextFloat() },
      ]);
      for (let step = 0; step < 30; step += 1) {
        sim.step();
      }
      return sim.hash();
    };
    expect(run(5)).toBe(run(5));
    expect(run(5)).not.toBe(run(6));
  });

  it('refuses an invalid config before anything runs', () => {
    const config = createDefaultGameConfig({ map: { numLanes: 0 } });
    expect(() => new Simulation(config, 1, new NullLogger())).toThrow(ConfigValidationError);
  });

  it('refuses an invalid seed', () => {
    expect(() => new Simulation(createDefaultGameConfig(), -1, new NullLogger())).toThrow(
      RangeError,
    );
  });
});
