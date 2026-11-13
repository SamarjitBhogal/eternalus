import { MemoryLogger } from '@eternalus/core';
import { ClientMessageParser } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';
import { TokenBucket } from '../limits/TokenBucket';
import { FakeDuelSimulation } from '../match/FakeDuelSimulation';
import { DuelHost } from '../match/DuelHost';
import { PresenceBook } from '../presence/PresenceBook';
import { MAX_HELD_GUESTS, RECONNECT_WINDOW_MS } from '../presence/PresenceBook.constants';
import { DuelQueue } from '../queue/DuelQueue';
import { FakeClock } from '../time/FakeClock';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { FakeConnection } from '../transport/FakeConnection';
import { DuelGateway } from './DuelGateway';

const JOIN = '{"type":"queue-join","name":"Ana"}';
const LEAVE = '{"type":"queue-leave"}';

const INTENT = JSON.stringify({
  type: 'intent',
  seq: 1,
  intent: { move: { x: 1, y: 0 }, aim: null, triggered: [] },
});

function setup(burst = 100) {
  let guests = 0;
  const simulation = new FakeDuelSimulation();
  const scheduler = new FakeTickScheduler();
  const host = new DuelHost({
    factory: { create: () => simulation },
    scheduler,
    tickIntervalMs: 33,
    versusMs: 0,
    logger: new MemoryLogger(),
  });
  const clock = new FakeClock();
  const queue = new DuelQueue(host);
  const presence = new PresenceBook({
    queue,
    host,
    scheduler,
    reconnectWindowMs: RECONNECT_WINDOW_MS,
    maxHeldGuests: MAX_HELD_GUESTS,
    newGuestId: () => `00000000-0000-4000-8000-${String((guests += 1)).padStart(12, '0')}`,
  });
  const gateway = new DuelGateway({
    parser: new ClientMessageParser(),
    queue,
    host,
    presence,
    newLimiter: () => new TokenBucket(clock, burst, 1),
  });
  // The `welcome` every connection gets first is covered in PresenceBook.test.ts: drop it here.
  const connect = (): FakeConnection => {
    const connection = new FakeConnection();
    gateway.accept(connection);
    connection.sent.length = 0;
    return connection;
  };
  // A disconnect whose reconnect window then runs out (the immediate drop these tests check).
  const drop = (connection: FakeConnection): void => {
    connection.close();
    scheduler.tick();
  };
  return { simulation, scheduler, connect, drop };
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
    const { connect, drop } = setup();
    const a = connect();
    const b = connect();
    const c = connect();
    a.receive('{"type":"queue-join","name":"Ana"}');
    a.receive('{"type":"queue-leave"}');
    b.receive('{"type":"queue-join","name":"Ana"}');
    drop(b);
    c.receive('{"type":"queue-join","name":"Ana"}');
    expect(c.sent).toEqual([{ type: 'queue-waiting' }]);
  });

  it('tells the opponent when a player disconnects mid-match', () => {
    const { connect, drop } = setup();
    const a = connect();
    const b = connect();
    a.receive('{"type":"queue-join","name":"Ana"}');
    b.receive('{"type":"queue-join","name":"Ana"}');
    drop(a);
    expect(b.sent.at(-1)).toMatchObject({ type: 'match-ended', reason: 'opponent-left' });
  });

  it('ends a match at once when a player forfeits, and refuses a forfeit outside one', () => {
    const { connect } = setup();
    const [a, b, c] = [connect(), connect(), connect()];
    c.receive('{"type":"forfeit"}');
    expect(c.sent).toEqual([{ type: 'rejected', reason: 'not-in-match' }]);
    a.receive(JOIN);
    b.receive(JOIN);
    a.receive('{"type":"forfeit"}');
    expect(b.sentOfType('match-ended')).toMatchObject([{ reason: 'opponent-left' }]);
  });

  it('ignores a second join by a waiting player and still pairs the next one with them', () => {
    const { connect } = setup();
    const a = connect();
    const b = connect();
    a.receive(JOIN);
    a.receive(JOIN);
    expect(a.sent).toEqual([{ type: 'queue-waiting' }]);
    b.receive(JOIN);
    expect(a.sentOfType('match-found')).toHaveLength(1);
    expect(b.sentOfType('match-found')).toHaveLength(1);
  });

  it('lets a player join again right after leaving', () => {
    const { connect } = setup();
    const a = connect();
    const b = connect();
    a.receive(JOIN);
    a.receive(LEAVE);
    a.receive(JOIN);
    expect(a.sentOfType('queue-waiting')).toHaveLength(2);
    b.receive(JOIN);
    expect(a.sentOfType('match-found')).toHaveLength(1);
  });

  it('ignores a leave by a connection that never joined', () => {
    const { connect } = setup();
    const a = connect();
    const b = connect();
    a.receive(JOIN);
    b.receive(LEAVE);
    expect(b.sent).toEqual([]);
    b.receive(JOIN);
    expect(b.sentOfType('match-found')).toHaveLength(1);
  });

  it('never pairs a player who disconnected while queued', () => {
    const { connect, drop } = setup();
    const [a, b, c] = [connect(), connect(), connect()];
    a.receive(JOIN);
    drop(a);
    b.receive(JOIN);
    expect(b.sent).toEqual([{ type: 'queue-waiting' }]);
    c.receive(JOIN);
    expect(a.sentOfType('match-found')).toHaveLength(0);
    expect(c.sentOfType('match-found')).toHaveLength(1);
  });

  it('forfeits a match when a player disconnects and frees the other to queue again', () => {
    const { connect, drop, scheduler } = setup();
    const [a, b, c] = [connect(), connect(), connect()];
    a.receive(JOIN);
    b.receive(JOIN);
    drop(a);
    expect(b.sentOfType('match-ended')).toEqual([
      { type: 'match-ended', reason: 'opponent-left', winner: null },
    ]);
    expect(b.isClosed).toBe(true);
    expect(scheduler.activeCount).toBe(0);
    const b2 = connect();
    b2.receive(JOIN);
    c.receive(JOIN);
    expect(b2.sentOfType('match-found')).toHaveLength(1);
    expect(c.sentOfType('match-found')).toHaveLength(1);
  });

  it('handles a disconnect right before and right after a pairing', () => {
    const { connect, drop, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    a.receive(JOIN);
    drop(a);
    b.receive(JOIN);
    expect(b.sent).toEqual([{ type: 'queue-waiting' }]);
    const [c, d] = [connect(), connect()];
    b.receive(LEAVE);
    c.receive(JOIN);
    d.receive(JOIN);
    drop(d);
    expect(c.sent.at(-1)).toMatchObject({ type: 'match-ended', reason: 'opponent-left' });
    expect(scheduler.activeCount).toBe(0);
  });

  it('pairs an even crowd once each, with no player in two matches', () => {
    const { connect, scheduler } = setup();
    const crowd = Array.from({ length: 6 }, connect);
    crowd.forEach((connection) => {
      connection.receive(JOIN);
    });
    const ids = crowd.map((connection) => connection.sentOfType('match-found')[0]?.matchId);
    expect(crowd.map((connection) => connection.sentOfType('match-found').length)).toEqual([
      1, 1, 1, 1, 1, 1,
    ]);
    expect(new Set(ids).size).toBe(3);
    expect(scheduler.activeCount).toBe(3);
  });
});
