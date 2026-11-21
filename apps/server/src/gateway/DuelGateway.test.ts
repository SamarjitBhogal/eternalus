import { MemoryLogger } from '@eternalus/core';
import { ClientMessageParser } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';
import { TokenBucket } from '../limits/TokenBucket';
import { FakeDuelSimulation } from '../match/FakeDuelSimulation';
import { DuelHost } from '../match/DuelHost';
import { DuelQueue } from '../queue/DuelQueue';
import { FakeClock } from '../time/FakeClock';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { FakeConnection } from '../transport/FakeConnection';
import { DuelGateway } from './DuelGateway';

const INTENT = JSON.stringify({
  type: 'intent',
  seq: 1,
  intent: { move: { x: 1, y: 0 }, aim: null, triggered: [] },
});

function setup(burst = 100) {
  const simulation = new FakeDuelSimulation();
  const host = new DuelHost({
    factory: { create: () => simulation },
    scheduler: new FakeTickScheduler(),
    tickIntervalMs: 33,
    versusMs: 0,
    logger: new MemoryLogger(),
  });
  const clock = new FakeClock();
  const gateway = new DuelGateway(
    new ClientMessageParser(),
    new DuelQueue(host),
    host,
    () => new TokenBucket(clock, burst, 1),
  );
  const connect = (): FakeConnection => {
    const connection = new FakeConnection();
    gateway.accept(connection);
    return connection;
  };
  return { simulation, connect };
}

describe('DuelGateway', () => {
  it('rejects malformed and oversized messages', () => {
    const { connect } = setup();
    const a = connect();
    a.receive('nope');
    a.receive('x'.repeat(5000));
    expect(a.sent).toEqual([
      { type: 'rejected', reason: 'malformed' },
      { type: 'rejected', reason: 'too-large' },
    ]);
  });

  it('rejects an intent outside a match', () => {
    const { connect } = setup();
    const a = connect();
    a.receive(INTENT);
    expect(a.sent).toEqual([{ type: 'rejected', reason: 'not-in-match' }]);
  });

  it('rate-limits a connection', () => {
    const { connect } = setup(2);
    const a = connect();
    a.receive(INTENT);
    a.receive(INTENT);
    a.receive(INTENT);
    expect(a.sent.at(-1)).toEqual({ type: 'rejected', reason: 'rate-limited' });
  });

  it('queues, pairs, routes intents and refuses queue messages mid-match', () => {
    const { connect, simulation } = setup();
    const a = connect();
    const b = connect();
    a.receive('{"type":"queue-join","name":"Ana"}');
    expect(a.sent).toEqual([{ type: 'queue-waiting' }]);
    b.receive('{"type":"queue-join","name":"Bob"}');
    expect(a.sentOfType('match-found')).toHaveLength(1);
    expect(b.sentOfType('match-found')).toHaveLength(1);
    expect(a.sentOfType('match-found')[0]?.opponentName).toBe('Bob');
    expect(b.sentOfType('match-found')[0]?.opponentName).toBe('Ana');
    a.receive(INTENT);
    expect(simulation.intents).toHaveLength(1);
    a.receive('{"type":"queue-join","name":"Ana"}');
    a.receive('{"type":"queue-leave"}');
    expect(a.sentOfType('rejected')).toEqual([
      { type: 'rejected', reason: 'in-match' },
      { type: 'rejected', reason: 'in-match' },
    ]);
  });

  it('removes a waiting player who leaves or disconnects', () => {
    const { connect } = setup();
    const a = connect();
    const b = connect();
    const c = connect();
    a.receive('{"type":"queue-join","name":"Ana"}');
    a.receive('{"type":"queue-leave"}');
    b.receive('{"type":"queue-join","name":"Ana"}');
    b.close();
    c.receive('{"type":"queue-join","name":"Ana"}');
    expect(c.sent).toEqual([{ type: 'queue-waiting' }]);
  });

  it('tells the opponent when a player disconnects mid-match', () => {
    const { connect } = setup();
    const a = connect();
    const b = connect();
    a.receive('{"type":"queue-join","name":"Ana"}');
    b.receive('{"type":"queue-join","name":"Ana"}');
    a.close();
    expect(b.sent.at(-1)).toMatchObject({ type: 'match-ended', reason: 'opponent-left' });
  });
});
