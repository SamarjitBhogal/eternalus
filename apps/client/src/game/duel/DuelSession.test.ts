import { MemoryLogger } from '@eternalus/core';
import type { MatchEnding } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';

import { FakeMessageTransport } from '../engine/net/FakeMessageTransport';
import { snapshotAtTick } from './__fixtures__/snapshots';
import { DuelSession } from './DuelSession';
import type { DuelSessionHandlers } from './DuelSession.types';

const INTENT = { move: { x: 1, y: 0 }, aim: null, triggered: [] };

function setUp() {
  const transports: FakeMessageTransport[] = [];
  const calls: string[] = [];
  const results: MatchEnding[] = [];
  const handlers: DuelSessionHandlers = {
    started: () => calls.push('started'),
    ended: (result) => {
      calls.push('ended');
      results.push(result);
    },
    lost: () => calls.push('lost'),
  };
  const logger = new MemoryLogger();
  const session = new DuelSession({
    createTransport: () => {
      const transport = new FakeMessageTransport();
      transports.push(transport);
      return transport;
    },
    logger,
    handlers,
  });
  const transport = (): FakeMessageTransport => {
    const [first] = transports;
    if (first === undefined) throw new Error('No transport was built');
    return first;
  };
  const pair = (): void => {
    session.join();
    transport().receive({
      type: 'match-found',
      matchId: 'm1',
      seed: 42,
      team: 'dark',
      legendId: 'entity-9',
    });
    transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
  };
  return { session, transport, transports, calls, results, logger, pair };
}

describe('DuelSession', () => {
  it('connects and joins the queue once', () => {
    const { session, transport, transports } = setUp();

    session.join();
    session.join();

    expect(session.status).toBe('queued');
    expect(transports).toHaveLength(1);
    expect(transport().sent).toEqual([{ type: 'queue-join' }]);
  });

  it('starts when paired and the first snapshot arrives, with its Legend and snapshot', () => {
    const { session, transport, calls } = setUp();
    session.join();

    transport().receive({ type: 'queue-waiting' });
    transport().receive({
      type: 'match-found',
      matchId: 'm1',
      seed: 42,
      team: 'dark',
      legendId: 'entity-9',
    });
    expect(calls).toEqual([]);
    expect(session.status).toBe('matched');
    const first = snapshotAtTick(1);
    transport().receive({ type: 'state', snapshot: first, ackSeq: 0 });

    expect(calls).toEqual(['started']);
    expect(session.status).toBe('started');
    expect(session.legendId).toBe('entity-9');
    expect(session.latestSnapshot()).toBe(first);
  });

  it('keeps the newest snapshot and does not start twice', () => {
    const { session, transport, calls, pair } = setUp();
    pair();
    const newer = snapshotAtTick(4);

    transport().receive({ type: 'state', snapshot: newer, ackSeq: 3 });

    expect(session.latestSnapshot()).toBe(newer);
    expect(calls).toEqual(['started']);
  });

  it('sends intents with a rising seq once started, and not before', () => {
    const { session, transport, pair } = setUp();
    session.join();
    session.sendIntent(INTENT);
    pair();

    session.sendIntent(INTENT);
    session.sendIntent(INTENT);
    session.sendIntent(INTENT);

    expect(transport().sent).toEqual([
      { type: 'queue-join' },
      { type: 'intent', seq: 0, intent: INTENT },
      { type: 'intent', seq: 1, intent: INTENT },
      { type: 'intent', seq: 2, intent: INTENT },
    ]);
  });

  it('reports the end of the match with its result, closes the transport and sends no more intents', () => {
    const { session, transport, calls, results, pair } = setUp();
    pair();

    transport().receive({ type: 'match-ended', reason: 'finished', winner: 'dark' });
    session.sendIntent(INTENT);

    expect(calls).toEqual(['started', 'ended']);
    expect(results).toEqual([{ winner: 'dark', reason: 'finished' }]);
    expect(session.status).toBe('ended');
    expect(transport().hasEnded).toBe(true);
    expect(transport().sent).toEqual([{ type: 'queue-join' }]);
  });

  it('reports the end of the match when it arrives between match-found and the first state', () => {
    const { session, transport, calls, results } = setUp();
    session.join();
    transport().receive({
      type: 'match-found',
      matchId: 'm1',
      seed: 42,
      team: 'light',
      legendId: 'entity-9',
    });

    transport().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'light' });
    transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });

    expect(calls).toEqual(['ended']);
    expect(results).toEqual([{ winner: 'light', reason: 'opponent-left' }]);
    expect(session.status).toBe('ended');
    expect(transport().hasEnded).toBe(true);
  });

  it('ignores a match-ended while still queued', () => {
    const { session, transport, calls } = setUp();
    session.join();

    transport().receive({ type: 'match-ended', reason: 'finished', winner: null });

    expect(calls).toEqual([]);
    expect(session.status).toBe('queued');
  });

  it('reports a lost connection before the match ended, and resets', () => {
    const { session, transport, calls, pair } = setUp();
    pair();

    transport().drop();

    expect(calls).toEqual(['started', 'lost']);
    expect(session.status).toBe('idle');
  });

  it('reports a lost connection while queued', () => {
    const { session, transport, calls } = setUp();
    session.join();

    transport().drop();

    expect(calls).toEqual(['lost']);
    expect(session.status).toBe('idle');
  });

  it('does not report a connection that closes after the match ended', () => {
    const { transport, calls, pair } = setUp();
    pair();
    transport().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'dark' });

    transport().drop();

    expect(calls).toEqual(['started', 'ended']);
  });

  it('sends queue-leave and closes when the player leaves the queue, and reports nothing', () => {
    const { session, transport, calls } = setUp();
    session.join();

    session.leave();
    transport().drop();

    expect(transport().sent).toEqual([{ type: 'queue-join' }, { type: 'queue-leave' }]);
    expect(transport().hasEnded).toBe(true);
    expect(session.status).toBe('idle');
    expect(calls).toEqual([]);
  });

  it('closes without queue-leave once matched, and can join again', () => {
    const { session, transport, transports, pair } = setUp();
    pair();

    session.leave();
    session.join();

    expect(transport().sent).toEqual([{ type: 'queue-join' }]);
    expect(transports).toHaveLength(2);
    expect(session.status).toBe('queued');
  });

  it('logs a refusal from the server', () => {
    const { session, transport, logger } = setUp();
    session.join();

    transport().receive({ type: 'rejected', reason: 'rate-limited' });

    expect(logger.records.map(({ severityText, scope }) => [severityText, scope])).toEqual([
      ['WARN', 'client.duel'],
    ]);
  });

  it('has no Legend or snapshot before the server sent them', () => {
    const { session } = setUp();
    expect(() => session.legendId).toThrow('match-found');
    expect(() => session.mapSeed).toThrow('match-found');
    expect(() => session.latestSnapshot()).toThrow('no snapshot');
  });
});
