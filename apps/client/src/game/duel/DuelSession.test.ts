import { MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { FakeMessageTransport } from '../engine/net/FakeMessageTransport';
import { snapshotAtTick } from './__fixtures__/snapshots';
import { DuelSession } from './DuelSession';
import type { DuelResult, DuelSessionHandlers, GuestIdStore } from './DuelSession.types';

const INTENT = { move: { x: 1, y: 0 }, aim: null, triggered: [] };

const GUEST_ID = '123e4567-e89b-42d3-a456-426614174000';

function setUp(
  guestIds: GuestIdStore = { load: () => Promise.resolve(null), save: () => Promise.resolve() },
) {
  const transports: FakeMessageTransport[] = [];
  const calls: string[] = [];
  const paired: string[] = [];
  const results: DuelResult[] = [];
  const handlers: DuelSessionHandlers = {
    matched: (opponent) => paired.push(opponent),
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
    guestIds,
    logger,
    handlers,
  });
  const transport = (): FakeMessageTransport => {
    const [first] = transports;
    if (first === undefined) throw new Error('No transport was built');
    return first;
  };
  const pair = (): void => {
    session.join('Ana');
    transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
      matchId: 'm1',
      seed: 42,
      team: 'dark',
      legendId: 'entity-9',
    });
    transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
  };
  return { session, transport, transports, calls, paired, results, logger, pair };
}

describe('DuelSession', () => {
  it('tells its owner the opponent name when the server pairs it, before the first snapshot', () => {
    const { session, transport, paired, calls } = setUp();
    session.join('Ana');

    transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
      matchId: 'm1',
      seed: 42,
      team: 'dark',
      legendId: 'entity-9',
    });

    expect(paired).toEqual(['Rival']);
    expect(calls).toEqual([]);
  });

  it('connects and joins the queue once', () => {
    const { session, transport, transports } = setUp();

    session.join('Ana');
    session.join('Ana');

    expect(session.status).toBe('queued');
    expect(transports).toHaveLength(1);
    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }]);
  });

  it('starts when paired and the first snapshot arrives, with its Legend and snapshot', () => {
    const { session, transport, calls } = setUp();
    session.join('Ana');

    transport().receive({ type: 'queue-waiting' });
    transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
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
    session.join('Ana');
    session.sendIntent(INTENT);
    pair();

    session.sendIntent(INTENT);
    session.sendIntent(INTENT);
    session.sendIntent(INTENT);

    expect(transport().sent).toEqual([
      { type: 'queue-join', name: 'Ana' },
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
    expect(results).toEqual([{ winner: 'dark', reason: 'finished', team: 'dark' }]);
    expect(session.status).toBe('ended');
    expect(transport().hasEnded).toBe(true);
    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }]);
  });

  it('reports the end of the match when it arrives between match-found and the first state', () => {
    const { session, transport, calls, results } = setUp();
    session.join('Ana');
    transport().receive({
      type: 'match-found',
      opponentName: 'Rival',
      matchId: 'm1',
      seed: 42,
      team: 'light',
      legendId: 'entity-9',
    });

    transport().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'light' });
    transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });

    expect(calls).toEqual(['ended']);
    expect(results).toEqual([{ winner: 'light', reason: 'opponent-left', team: 'light' }]);
    expect(session.status).toBe('ended');
    expect(transport().hasEnded).toBe(true);
  });

  it('ignores a match-ended while still queued', () => {
    const { session, transport, calls } = setUp();
    session.join('Ana');

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
    session.join('Ana');

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
    session.join('Ana');

    session.leave();
    transport().drop();

    expect(transport().sent).toEqual([
      { type: 'queue-join', name: 'Ana' },
      { type: 'queue-leave' },
    ]);
    expect(transport().hasEnded).toBe(true);
    expect(session.status).toBe('idle');
    expect(calls).toEqual([]);
  });

  it('closes without queue-leave once matched, and can join again', () => {
    const { session, transport, transports, pair } = setUp();
    pair();

    session.leave();
    session.join('Ana');

    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }]);
    expect(transports).toHaveLength(2);
    expect(session.status).toBe('queued');
  });

  it('logs a refusal from the server', () => {
    const { session, transport, logger } = setUp();
    session.join('Ana');

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

  it('keeps the guest id the server issues and sends it on the next join', () => {
    const saved: string[] = [];
    const { session, transport, transports } = setUp({
      load: () => Promise.resolve(null),
      save: (id) => {
        saved.push(id);
        return Promise.resolve();
      },
    });
    session.join('Ana');
    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }]);
    transport().receive({ type: 'welcome', guestId: GUEST_ID });
    expect(saved).toEqual([GUEST_ID]);
    session.close();
    session.join('Ana');
    expect(transports[1]?.sent).toEqual([{ type: 'queue-join', name: 'Ana', guestId: GUEST_ID }]);
  });

  it('sends the guest id saved by an earlier visit', async () => {
    const { session, transport } = setUp({
      load: () => Promise.resolve(GUEST_ID),
      save: () => Promise.resolve(),
    });
    await Promise.resolve();
    session.join('Ana');
    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana', guestId: GUEST_ID }]);
  });

  it('still joins when storage fails to read or to write', async () => {
    const { session, transport, logger } = setUp({
      load: () => Promise.reject(new Error('denied')),
      save: () => Promise.reject(new Error('denied')),
    });
    await Promise.resolve();
    session.join('Ana');
    transport().receive({ type: 'welcome', guestId: GUEST_ID });
    await Promise.resolve();
    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }]);
    expect(session.status).toBe('queued');
    expect(logger.records.length).toBeGreaterThanOrEqual(2);
  });
});
