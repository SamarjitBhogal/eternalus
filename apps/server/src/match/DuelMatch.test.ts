import { MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { FakeConnection } from '../transport/FakeConnection';
import { DuelMatch } from './DuelMatch';
import { FakeDuelSimulation } from './FakeDuelSimulation';

const INTENT = { move: { x: 1, y: 0 }, aim: null, triggered: [] };

function setup(versusMs = 0) {
  const light = new FakeConnection();
  const dark = new FakeConnection();
  const simulation = new FakeDuelSimulation();
  const scheduler = new FakeTickScheduler();
  const logger = new MemoryLogger();
  const ended: DuelMatch[] = [];
  const match = new DuelMatch({
    id: 'duel-1',
    seats: { light, dark },
    simulation,
    scheduler,
    tickIntervalMs: 33,
    versusMs,
    names: { light: 'Ana', dark: 'Ben' },
    logger,
    onEnded: (m) => ended.push(m),
  });
  match.start();
  return { light, dark, simulation, scheduler, logger, ended, match };
}

describe('DuelMatch', () => {
  it('tells each seat its team and Legend, and schedules the tick interval', () => {
    const { light, dark, scheduler } = setup();
    expect(light.sent).toEqual([
      {
        type: 'match-found',
        matchId: 'duel-1',
        seed: 7,
        team: 'light',
        legendId: 'legend-light',
        opponentName: 'Ben',
      },
    ]);
    expect(dark.sent[0]).toMatchObject({
      team: 'dark',
      legendId: 'legend-dark',
      opponentName: 'Ana',
    });
    expect(scheduler.intervals).toEqual([33]);
  });

  it('waits out the VERSUS screen before the first step', () => {
    const { simulation, scheduler, light } = setup(66);
    scheduler.tick();
    scheduler.tick();
    expect(simulation.steps).toBe(0);
    expect(light.sentOfType('state')).toHaveLength(0);
    scheduler.tick();
    expect(simulation.steps).toBe(1);
  });

  it('steps and sends every seat the state with its own ackSeq', () => {
    const { light, dark, simulation, scheduler, match } = setup();
    match.submit(light, 4, INTENT);
    scheduler.tick();
    expect(simulation.steps).toBe(1);
    expect(light.sentOfType('state')[0]?.ackSeq).toBe(4);
    expect(dark.sentOfType('state')[0]?.ackSeq).toBe(-1);
    expect(simulation.intents).toEqual([{ team: 'light', intent: INTENT }]);
  });

  it('drops stale or repeated seq and intents from strangers', () => {
    const { light, simulation, match } = setup();
    match.submit(light, 2, INTENT);
    match.submit(light, 2, INTENT);
    match.submit(light, 1, INTENT);
    match.submit(new FakeConnection(), 9, INTENT);
    expect(simulation.intents).toHaveLength(1);
  });

  it('ends with the winner when the simulation is over, and stops ticking', () => {
    const { light, dark, simulation, scheduler, ended } = setup();
    simulation.result = { winner: 'dark' };
    scheduler.tick();
    for (const c of [light, dark]) {
      expect(c.sent.at(-1)).toEqual({ type: 'match-ended', reason: 'finished', winner: 'dark' });
    }
    expect(scheduler.activeCount).toBe(0);
    expect(ended).toHaveLength(1);
    expect([light.isClosed, dark.isClosed]).toEqual([true, true]);
  });

  it('ends with opponent-left for the one who stays', () => {
    const { light, dark, scheduler, ended, match } = setup();
    match.leave(light);
    match.leave(dark);
    expect(dark.sent.at(-1)).toEqual({
      type: 'match-ended',
      reason: 'opponent-left',
      winner: null,
    });
    expect(light.sentOfType('match-ended')).toEqual([]);
    expect(scheduler.activeCount).toBe(0);
    expect(ended).toHaveLength(1);
    match.submit(dark, 1, INTENT);
  });

  it('logs and ends instead of throwing when a step fails', () => {
    const { light, simulation, scheduler, logger, ended } = setup();
    simulation.failOnStep = true;
    expect(() => {
      scheduler.tick();
    }).not.toThrow();
    expect(logger.records).toHaveLength(1);
    expect(light.sent.at(-1)).toMatchObject({ type: 'match-ended', winner: null });
    expect(ended).toHaveLength(1);
  });
});
