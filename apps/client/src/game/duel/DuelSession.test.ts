import { MemoryLogger } from '@eternalus/core';
import { type MatchEnding, RECONNECT_WINDOW_MS } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';

import { FakeMessageTransport } from '../engine/net/FakeMessageTransport';
import { FakeSessionClock } from '../engine/time/FakeSessionClock';
import { snapshotAtTick } from './__fixtures__/snapshots';
import { DuelSession } from './DuelSession';
import type { DuelSessionHandlers, GuestIdStore } from './DuelSession.types';

const INTENT = { move: { x: 1, y: 0 }, aim: null, triggered: [] };

const GUEST_ID = '123e4567-e89b-42d3-a456-426614174000';

const THROWAWAY_ID = '00000000-0000-4000-8000-000000000001';

const MATCH_FOUND = {
  type: 'match-found',
  opponentName: 'Rival',
  matchId: 'm1',
  seed: 42,
  team: 'dark',
  legendId: 'entity-9',
} as const;

function setUp(
  guestIds: GuestIdStore = { load: () => Promise.resolve(null), save: () => Promise.resolve() },
) {
  const transports: FakeMessageTransport[] = [];
  const calls: string[] = [];
  const paired: string[] = [];
  const results: MatchEnding[] = [];
  const handlers: DuelSessionHandlers = {
    matched: (opponent) => paired.push(opponent),
    started: () => calls.push('started'),
    ended: (result) => {
      calls.push('ended');
      results.push(result);
    },
    opponentPresence: (graceMs) => calls.push(`opponent:${String(graceMs)}`),
    reconnecting: () => calls.push('reconnecting'),
    reconnected: () => calls.push('reconnected'),
    lost: () => calls.push('lost'),
  };
  const logger = new MemoryLogger();
  const clock = new FakeSessionClock();
  const session = new DuelSession({
    createTransport: () => {
      const transport = new FakeMessageTransport();
      transports.push(transport);
      return transport;
    },
    guestIds,
    clock,
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
  /** The newest transport: the latest reconnect attempt once there is one. */
  const latest = (): FakeMessageTransport => {
    const last = transports.at(-1);
    if (last === undefined) throw new Error('No transport was built');
    return last;
  };
  /** Paired and started under the guest id `GUEST_ID`, so a drop can reconnect. */
  const play = (): void => {
    session.join('Ana');
    transport().receive({ type: 'welcome', guestId: GUEST_ID });
    transport().receive(MATCH_FOUND);
    transport().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });
  };
  return {
    session,
    transport,
    transports,
    calls,
    paired,
    results,
    logger,
    clock,
    pair,
    play,
    latest,
  };
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
    expect(results).toEqual([{ winner: 'dark', reason: 'finished' }]);
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
    expect(results).toEqual([{ winner: 'light', reason: 'opponent-left' }]);
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

  it('reports a lost connection at once when it has no guest id to reconnect with, and resets', () => {
    const { session, transport, calls, pair } = setUp();
    pair();

    transport().drop();

    expect(calls).toEqual(['started', 'lost']);
    expect(session.status).toBe('idle');
  });

  it('tracks the opponent dropping and coming back', () => {
    const { session, transport, calls, pair } = setUp();
    pair();
    expect(session.opponentDisconnectedGraceMs).toBeNull();

    transport().receive({ type: 'opponent-presence', status: 'disconnected', graceMs: 10_000 });
    expect(session.opponentDisconnectedGraceMs).toBe(10_000);
    transport().receive({ type: 'opponent-presence', status: 'reconnected' });

    expect(session.opponentDisconnectedGraceMs).toBeNull();
    expect(calls).toEqual(['started', 'opponent:10000', 'opponent:null']);
  });

  it('ignores opponent presence outside a match', () => {
    const { session, transport, calls } = setUp();
    session.join('Ana');
    transport().receive({ type: 'opponent-presence', status: 'disconnected', graceMs: 10_000 });
    expect(session.opponentDisconnectedGraceMs).toBeNull();
    expect(calls).toEqual([]);
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

  it('sends forfeit and closes when forfeiting a paired Duel', () => {
    const { session, transport, pair } = setUp();
    pair();

    session.forfeit();

    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }, { type: 'forfeit' }]);
    expect(transport().hasEnded).toBe(true);
    expect(session.status).toBe('idle');
  });

  it('only closes, sending no forfeit, when forfeiting while queued', () => {
    const { session, transport } = setUp();
    session.join('Ana');

    session.forfeit();

    expect(transport().sent).toEqual([{ type: 'queue-join', name: 'Ana' }]);
    expect(session.status).toBe('idle');
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

describe('DuelSession, automatic reconnect (DEC-349)', () => {
  it('reconnects on a drop inside the window and goes on with the same Duel, with no click', () => {
    const { session, transport, transports, calls, paired, clock, play, latest } = setUp();
    play();

    transport().drop();
    expect(session.status).toBe('reconnecting');
    expect(calls).toEqual(['started', 'reconnecting']);
    session.sendIntent(INTENT);
    clock.advance(250);
    expect(transports).toHaveLength(2);
    expect(latest().sent).toEqual([{ type: 'queue-join', name: 'Ana', guestId: GUEST_ID }]);
    latest().receive({ type: 'welcome', guestId: THROWAWAY_ID });
    latest().receive({ type: 'welcome', guestId: GUEST_ID });
    latest().receive(MATCH_FOUND);
    const resumed = snapshotAtTick(90);
    latest().receive({ type: 'state', snapshot: resumed, ackSeq: 0 });
    session.sendIntent(INTENT);

    expect(session.status).toBe('started');
    expect(calls).toEqual(['started', 'reconnecting', 'reconnected']);
    expect(paired).toEqual(['Rival']);
    expect(session.latestSnapshot()).toBe(resumed);
    expect(latest().sent.at(-1)).toEqual({ type: 'intent', seq: 0, intent: INTENT });
    clock.advance(RECONNECT_WINDOW_MS);
    expect(calls).toEqual(['started', 'reconnecting', 'reconnected']);
  });

  it('loses the Duel only when a longer drop outlasts the window', () => {
    const { session, transport, calls, clock, play, latest } = setUp();
    play();
    transport().drop();

    for (let elapsed = 0; elapsed < RECONNECT_WINDOW_MS - 250; elapsed += 250) {
      clock.advance(250);
      if (latest() !== transport()) latest().drop();
    }
    expect(calls).toEqual(['started', 'reconnecting']);
    clock.advance(250);

    expect(calls).toEqual(['started', 'reconnecting', 'lost']);
    expect(session.status).toBe('idle');
    expect(latest().hasEnded).toBe(true);
    clock.advance(RECONNECT_WINDOW_MS);
    expect(calls).toEqual(['started', 'reconnecting', 'lost']);
  });

  it('backs off between failed attempts', () => {
    const { transport, transports, clock, play, latest } = setUp();
    play();
    transport().drop();
    const startedAt: number[] = [];

    while (transports.length < 7) {
      const count = transports.length;
      clock.advance(1);
      if (transports.length > count) {
        startedAt.push(clock.now());
        latest().drop();
      }
    }

    expect(startedAt).toEqual([250, 750, 1750, 3750, 5750, 7750]);
  });

  it('leaves the queue and tries again when an attempt is queued instead of seated', () => {
    const { session, transports, transport, clock, play, latest } = setUp();
    play();
    transport().drop();
    clock.advance(250);
    const queued = latest();

    queued.receive({ type: 'welcome', guestId: THROWAWAY_ID });
    queued.receive({ type: 'queue-waiting' });

    expect(queued.sent.at(-1)).toEqual({ type: 'queue-leave' });
    expect(queued.hasEnded).toBe(true);
    expect(session.status).toBe('reconnecting');
    clock.advance(500);
    expect(transports).toHaveLength(3);
    expect(latest().sent).toEqual([{ type: 'queue-join', name: 'Ana', guestId: GUEST_ID }]);
  });

  it('does not save the throwaway id an attempt is welcomed with', () => {
    const saved: string[] = [];
    const { transport, clock, play, latest } = setUp({
      load: () => Promise.resolve(null),
      save: (id) => {
        saved.push(id);
        return Promise.resolve();
      },
    });
    play();
    transport().drop();
    clock.advance(250);

    latest().receive({ type: 'welcome', guestId: THROWAWAY_ID });

    expect(saved).toEqual([GUEST_ID]);
  });

  it('ignores a match-found while the Duel is already running', () => {
    const { session, transport, calls, paired, play } = setUp();
    play();

    transport().receive({ ...MATCH_FOUND, legendId: 'entity-2' });

    expect(session.status).toBe('started');
    expect(session.legendId).toBe('entity-9');
    expect(paired).toEqual(['Rival']);
    expect(calls).toEqual(['started']);
  });

  it('reconnects during VERSUS and starts once the first snapshot arrives', () => {
    const { session, transport, calls, paired, clock, latest } = setUp();
    session.join('Ana');
    transport().receive({ type: 'welcome', guestId: GUEST_ID });
    transport().receive(MATCH_FOUND);

    transport().drop();
    clock.advance(250);
    latest().receive(MATCH_FOUND);
    expect(session.status).toBe('matched');
    latest().receive({ type: 'state', snapshot: snapshotAtTick(1), ackSeq: 0 });

    expect(paired).toEqual(['Rival']);
    expect(calls).toEqual(['reconnecting', 'reconnected', 'started']);
  });

  it('reports the end of the match the server sends to a reconnect attempt', () => {
    const { session, transport, calls, results, clock, play, latest } = setUp();
    play();
    transport().drop();
    clock.advance(250);

    latest().receive({ type: 'match-ended', reason: 'opponent-left', winner: 'dark' });
    clock.advance(RECONNECT_WINDOW_MS);

    expect(calls).toEqual(['started', 'reconnecting', 'ended']);
    expect(results).toEqual([{ winner: 'dark', reason: 'opponent-left' }]);
    expect(session.status).toBe('ended');
  });

  it('stops reconnecting when the owner closes the session', () => {
    const { session, transport, transports, calls, clock, play } = setUp();
    play();
    transport().drop();

    session.close();
    clock.advance(RECONNECT_WINDOW_MS);

    expect(transports).toHaveLength(1);
    expect(calls).toEqual(['started', 'reconnecting']);
    expect(session.status).toBe('idle');
  });
});
