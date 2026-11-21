import { MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { FakeConnection } from '../transport/FakeConnection';
import { DuelHost } from './DuelHost';
import { FakeDuelSimulation } from './FakeDuelSimulation';

const INTENT = { move: { x: 0, y: 1 }, aim: null, triggered: [] };

function setup(fails = false) {
  const simulation = new FakeDuelSimulation();
  const scheduler = new FakeTickScheduler();
  const logger = new MemoryLogger();
  const host = new DuelHost({
    factory: {
      create: () => {
        if (fails) throw new Error('no map');
        return simulation;
      },
    },
    scheduler,
    tickIntervalMs: 33,
    versusMs: 0,
    logger,
  });
  return { host, simulation, scheduler, logger };
}

describe('DuelHost', () => {
  it('starts a match, routes intents and forgets it when it ends', () => {
    const { host, simulation, scheduler } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    host.start({ connection: a, name: 'Ana' }, { connection: b, name: 'Ben' });
    expect(host.isInMatch(a)).toBe(true);
    expect(host.submit(b, 1, INTENT)).toBe(true);
    expect(simulation.intents[0]?.team).toBe('dark');
    simulation.result = { winner: 'light' };
    scheduler.tick();
    expect(host.isInMatch(a)).toBe(false);
    expect(host.submit(a, 2, INTENT)).toBe(false);
  });

  it('closes both connections after the verdict and cleans up once their close handlers run', () => {
    const { host, simulation, scheduler } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    // The gateway's close handler: a closing player leaves the host.
    a.onClose(() => {
      host.leave(a);
    });
    b.onClose(() => {
      host.leave(b);
    });
    host.start({ connection: a, name: 'Ana' }, { connection: b, name: 'Ben' });
    simulation.result = { winner: 'light' };
    scheduler.tick();
    expect([a.isClosed, b.isClosed]).toEqual([true, true]);
    expect(a.sentOfType('match-ended')).toHaveLength(1);
    expect(b.sentOfType('match-ended')).toHaveLength(1);
    expect([host.isInMatch(a), host.isInMatch(b)]).toEqual([false, false]);
  });

  it('ends the match when a player leaves', () => {
    const { host } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    host.start({ connection: a, name: 'Ana' }, { connection: b, name: 'Ben' });
    host.leave(a);
    expect(b.sent.at(-1)).toMatchObject({ reason: 'opponent-left' });
    expect(host.isInMatch(b)).toBe(false);
    host.leave(new FakeConnection());
  });

  it('closes both connections when the match cannot be built', () => {
    const { host, logger } = setup(true);
    const a = new FakeConnection();
    const b = new FakeConnection();
    host.start({ connection: a, name: 'Ana' }, { connection: b, name: 'Ben' });
    expect([a.isClosed, b.isClosed]).toEqual([true, true]);
    expect(logger.records).toHaveLength(1);
    expect(host.isInMatch(a)).toBe(false);
  });
});
