import { MemoryLogger } from '@eternalus/core';
import { ClientMessageParser, RECONNECT_WINDOW_MS } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';
import { DuelGateway } from '../gateway/DuelGateway';
import { TokenBucket } from '../limits/TokenBucket';
import { DuelHost } from '../match/DuelHost';
import { FakeDuelSimulation } from '../match/FakeDuelSimulation';
import { DuelQueue } from '../queue/DuelQueue';
import { BASE_RATING_GAP } from '../queue/DuelQueue.constants';
import { PlayerRatings } from '../rating/PlayerRatings';
import { FakeClock } from '../time/FakeClock';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { ConnectionHeartbeat } from '../transport/ConnectionHeartbeat';
import {
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_PROBE_TIMEOUT_MS,
} from '../transport/ConnectionHeartbeat.constants';
import { FakeConnection } from '../transport/FakeConnection';
import { PresenceBook } from './PresenceBook';
import { MAX_HELD_GUESTS, MAX_KNOWN_GUESTS } from './PresenceBook.constants';

const join = (guestId?: string): string =>
  JSON.stringify({
    type: 'queue-join',
    name: 'Ana',
    ...(guestId === undefined ? {} : { guestId }),
  });

function setup(maxHeldGuests = MAX_HELD_GUESTS, maxKnownGuests = MAX_KNOWN_GUESTS) {
  const scheduler = new FakeTickScheduler();
  const ratings = new PlayerRatings();
  const simulations: FakeDuelSimulation[] = [];
  const host = new DuelHost({
    factory: {
      create: () => {
        const simulation = new FakeDuelSimulation();
        simulations.push(simulation);
        return simulation;
      },
    },
    scheduler,
    tickIntervalMs: 33,
    versusMs: 0,
    logger: new MemoryLogger(),
    ratings,
  });
  const queue = new DuelQueue({
    starter: host,
    ratings,
    clock: new FakeClock(),
    scheduler: new FakeTickScheduler(),
  });
  const heartbeat = new ConnectionHeartbeat(
    scheduler,
    HEARTBEAT_INTERVAL_MS,
    HEARTBEAT_PROBE_TIMEOUT_MS,
  );
  let issued = 0;
  const presence = new PresenceBook({
    queue,
    host,
    ratings,
    scheduler,
    reconnectWindowMs: RECONNECT_WINDOW_MS,
    maxHeldGuests,
    maxKnownGuests,
    probe: (connection) => {
      heartbeat.probe(connection);
    },
    newGuestId: () => `00000000-0000-4000-8000-${String((issued += 1)).padStart(12, '0')}`,
  });
  const gateway = new DuelGateway({
    parser: new ClientMessageParser(),
    queue,
    host,
    presence,
    newLimiter: () => new TokenBucket(new FakeClock(), 100, 1),
  });
  const connect = (): FakeConnection => {
    const connection = new FakeConnection();
    heartbeat.watch(connection);
    gateway.accept(connection);
    return connection;
  };
  const guestIdOf = (connection: FakeConnection): string | undefined =>
    connection.sentOfType('welcome').at(-1)?.guestId;
  return { presence, scheduler, ratings, simulations, connect, guestIdOf };
}

describe('PresenceBook', () => {
  it('issues each connection its own id', () => {
    const { connect, guestIdOf } = setup();
    const [a, b] = [connect(), connect()];
    expect(guestIdOf(a)).toBeDefined();
    expect(guestIdOf(a)).not.toBe(guestIdOf(b));
  });

  it('gives a queued guest the same id and queue slot back inside the window', () => {
    const { connect, guestIdOf, presence } = setup();
    const a = connect();
    const id = guestIdOf(a);
    a.receive(join());
    a.close();
    expect(presence.counts()).toEqual({ online: 0, queued: 0, inMatch: 0, held: 1 });
    const a2 = connect();
    a2.receive(join(id));
    expect(guestIdOf(a2)).toBe(id);
    expect(a2.sentOfType('queue-waiting')).toHaveLength(1);
    expect(presence.counts()).toEqual({ online: 0, queued: 1, inMatch: 0, held: 0 });
    const b = connect();
    b.receive(join());
    expect(a2.sentOfType('match-found')).toHaveLength(1);
  });

  it('keeps an in-match seat: the match goes on and the new connection gets its state', () => {
    const { connect, guestIdOf, presence, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    const id = guestIdOf(a);
    a.receive(join());
    b.receive(join());
    a.close();
    expect(b.sentOfType('match-ended')).toEqual([]);
    const a2 = connect();
    a2.receive(join(id));
    expect(guestIdOf(a2)).toBe(id);
    expect(a2.sentOfType('match-found')).toMatchObject([{ team: 'light', opponentName: 'Ana' }]);
    expect(presence.counts().inMatch).toBe(2);
    scheduler.tick();
    expect(a2.sentOfType('state')).toHaveLength(1);
    expect(b.sentOfType('match-ended')).toEqual([]);
    a2.receive(
      JSON.stringify({
        type: 'intent',
        seq: 0,
        intent: { move: { x: 1, y: 0 }, aim: null, triggered: [] },
      }),
    );
    expect(a2.sentOfType('rejected')).toEqual([]);
  });

  it('tells the opponent when a seat is held and when it is taken back', () => {
    const { connect, guestIdOf, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    const id = guestIdOf(a);
    a.receive(join());
    b.receive(join());
    a.close();
    expect(b.sentOfType('opponent-presence')).toEqual([
      { type: 'opponent-presence', status: 'disconnected', graceMs: RECONNECT_WINDOW_MS },
    ]);
    connect().receive(join(id));
    expect(b.sentOfType('opponent-presence')).toHaveLength(2);
    expect(b.sentOfType('opponent-presence')[1]).toEqual({
      type: 'opponent-presence',
      status: 'reconnected',
    });
    scheduler.tick();
    expect(b.sentOfType('match-ended')).toEqual([]);
  });

  it('adds no second opponent presence message when the window runs out: match-ended covers it', () => {
    const { connect, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    a.receive(join());
    b.receive(join());
    a.close();
    scheduler.tick();
    expect(b.sentOfType('opponent-presence')).toHaveLength(1);
    expect(b.sentOfType('match-ended')).toMatchObject([{ reason: 'opponent-left' }]);
  });

  it('drops a queued guest after the window: the slot is gone, an unrated id is not remembered', () => {
    const { connect, guestIdOf, presence, scheduler } = setup();
    const a = connect();
    const id = guestIdOf(a);
    a.receive(join());
    a.close();
    scheduler.tick();
    expect(presence.counts()).toEqual({ online: 0, queued: 0, inMatch: 0, held: 0 });
    const a2 = connect();
    a2.receive(join(id));
    expect(guestIdOf(a2)).not.toBe(id);
    expect(a2.sentOfType('queue-waiting')).toHaveLength(1);
    expect(presence.counts().queued).toBe(1);
  });

  it('keeps a rating across Duels: the next pairing sees the last result', () => {
    const { connect, guestIdOf, ratings, simulations, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    const [idA, idB] = [guestIdOf(a), guestIdOf(b)];
    a.receive(join());
    b.receive(join());
    const [simulation] = simulations;
    if (simulation === undefined || idA === undefined || idB === undefined)
      throw new Error('no Duel');
    simulation.result = { winner: 'light' };
    scheduler.tick();
    expect([a.isClosed, b.isClosed]).toEqual([true, true]);
    const [a2, b2] = [connect(), connect()];
    a2.receive(join(idA));
    b2.receive(join(idB));
    expect([guestIdOf(a2), guestIdOf(b2)]).toEqual([idA, idB]);
    expect(ratings.get(idA)).toMatchObject({ matches: 1, wins: 1 });
    expect(ratings.get(idB)).toMatchObject({ matches: 1, losses: 1 });
    expect(ratings.get(idA).rating - ratings.get(idB).rating).toBeGreaterThan(BASE_RATING_GAP);
    // The winner and the loser are now too far apart to pair at once.
    expect(a2.sentOfType('match-found')).toEqual([]);
    expect(b2.sentOfType('queue-waiting')).toHaveLength(1);
  });

  /** Two fresh guests play one Duel that `light` wins; both sockets close at its end. */
  function playOne(harness: ReturnType<typeof setup>): { idA: string; idB: string } {
    const { connect, guestIdOf, simulations, scheduler } = harness;
    const [a, b] = [connect(), connect()];
    const [idA, idB] = [guestIdOf(a), guestIdOf(b)];
    a.receive(join());
    b.receive(join());
    const simulation = simulations[simulations.length - 1];
    if (simulation === undefined || idA === undefined || idB === undefined)
      throw new Error('no Duel');
    simulation.result = { winner: 'light' };
    scheduler.tick();
    return { idA, idB };
  }

  it('forgets the oldest gone rated guest beyond the cap, rating and all', () => {
    const harness = setup(MAX_HELD_GUESTS, 2);
    const { connect, guestIdOf, ratings } = harness;
    const { idA } = playOne(harness);
    expect(ratings.get(idA).matches).toBe(1);
    playOne(harness); // two more rated guests push the oldest, a, out
    const a2 = connect();
    a2.receive(join(idA));
    expect(guestIdOf(a2)).not.toBe(idA);
    expect(ratings.get(idA).matches).toBe(0);
  });

  it('(a) keeps the returning guest when the list is full and it is the oldest', () => {
    const harness = setup(MAX_HELD_GUESTS, 2);
    const { connect, guestIdOf, ratings } = harness;
    const { idA } = playOne(harness);
    const a2 = connect();
    a2.receive(join(idA));
    expect(guestIdOf(a2)).toBe(idA);
    expect(ratings.get(idA).matches).toBe(1);
  });

  it('(b) idle connect-and-close loops do not push rated guests out', () => {
    const harness = setup(MAX_HELD_GUESTS, 2);
    const { connect, guestIdOf, ratings } = harness;
    const { idA, idB } = playOne(harness);
    for (let i = 0; i < 5; i += 1) connect().close();
    expect([ratings.get(idA).matches, ratings.get(idB).matches]).toEqual([1, 1]);
    const a2 = connect();
    a2.receive(join(idA));
    expect(guestIdOf(a2)).toBe(idA);
  });

  it('never pairs a queued guest that is held: the next player waits', () => {
    const { connect, presence, scheduler } = setup();
    const ghost = connect();
    ghost.receive(join());
    ghost.close();
    const real = connect();
    real.receive(join());
    expect(real.sentOfType('match-found')).toEqual([]);
    expect(real.sentOfType('queue-waiting')).toHaveLength(1);
    scheduler.tick();
    expect(real.sentOfType('match-ended')).toEqual([]);
    expect(presence.counts()).toEqual({ online: 0, queued: 1, inMatch: 0, held: 0 });
  });

  it('sends welcome before the seat is handed back on a resume', () => {
    const { connect, guestIdOf } = setup();
    const [a, b] = [connect(), connect()];
    const id = guestIdOf(a);
    a.receive(join());
    b.receive(join());
    a.close();
    const a2 = connect();
    a2.receive(join(id));
    expect(a2.sent.map(({ type }) => type)).toEqual(['welcome', 'welcome', 'match-found']);
  });

  it('probes a seat whose socket still looks open; once that closes, a retry takes the seat', () => {
    const { connect, guestIdOf, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    const id = guestIdOf(a);
    a.receive(join());
    b.receive(join());
    const early = connect();
    early.receive(join(id));
    expect(a.pings).toBe(1);
    expect(early.sentOfType('match-found')).toEqual([]);
    scheduler.tickEvery(HEARTBEAT_PROBE_TIMEOUT_MS);
    expect(a.isTerminated).toBe(true);
    early.receive(JSON.stringify({ type: 'queue-leave' }));
    early.close();
    const retry = connect();
    retry.receive(join(id));
    expect(guestIdOf(retry)).toBe(id);
    expect(retry.sentOfType('match-found')).toHaveLength(1);
    expect(b.sentOfType('match-ended')).toEqual([]);
  });

  it('keeps a live seat that answers the probe', () => {
    const { connect, guestIdOf, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    const id = guestIdOf(a);
    a.receive(join());
    b.receive(join());
    const intruder = connect();
    intruder.receive(join(id));
    a.pong();
    scheduler.tickEvery(HEARTBEAT_PROBE_TIMEOUT_MS);
    expect(a.isTerminated).toBe(false);
    expect(guestIdOf(intruder)).not.toBe(id);
    expect(b.sentOfType('match-ended')).toEqual([]);
  });

  it('forfeits an in-match guest after the window', () => {
    const { connect, scheduler, presence } = setup();
    const [a, b] = [connect(), connect()];
    a.receive(join());
    b.receive(join());
    a.close();
    scheduler.tick();
    expect(b.sentOfType('match-ended')).toMatchObject([{ reason: 'opponent-left' }]);
    expect(presence.counts()).toEqual({ online: 0, queued: 0, inMatch: 0, held: 0 });
  });

  it('times the window with the configured length', () => {
    const { connect, scheduler } = setup();
    const a = connect();
    a.receive(join());
    a.close();
    expect(scheduler.intervals).toEqual([RECONNECT_WINDOW_MS]);
  });

  it('gives a malformed or unknown id a fresh one', () => {
    const { connect, guestIdOf, presence } = setup();
    const a = connect();
    a.receive(join('not-an-id'));
    const b = connect();
    b.receive(join('11111111-1111-4111-8111-111111111111'));
    expect(guestIdOf(b)).toBe('00000000-0000-4000-8000-000000000002');
    expect(presence.counts()).toEqual({ online: 0, queued: 0, inMatch: 2, held: 0 });
  });

  it('ignores the id of a guest that is still connected and does not kick it', () => {
    const { connect, guestIdOf, presence } = setup();
    const a = connect();
    const id = guestIdOf(a);
    a.receive(join());
    const a2 = connect();
    a2.receive(join(id));
    expect(a.isClosed).toBe(false);
    expect(guestIdOf(a2)).not.toBe(id);
    expect(presence.counts()).toEqual({ online: 0, queued: 0, inMatch: 2, held: 0 });
    expect(a.sentOfType('match-found')).toHaveLength(1);
  });

  it('holds a seat for the whole window: other ticks do not release it, the window does', () => {
    const { connect, scheduler } = setup();
    const [a, b] = [connect(), connect()];
    a.receive(join());
    b.receive(join());
    a.close();
    for (let tick = 0; tick < 5; tick += 1) scheduler.tickEvery(33);
    expect(b.sentOfType('match-ended')).toEqual([]);
    scheduler.tickEvery(RECONNECT_WINDOW_MS);
    expect(b.sentOfType('match-ended')).toMatchObject([{ reason: 'opponent-left' }]);
  });

  it('ends a match at once when both seats are held', () => {
    const { connect, scheduler, presence } = setup();
    const [a, b] = [connect(), connect()];
    a.receive(join());
    b.receive(join());
    a.close();
    b.close();
    expect(presence.counts()).toEqual({ online: 0, queued: 0, inMatch: 0, held: 0 });
    expect(scheduler.activeCount).toBe(0);
  });

  it('records the loss for the one who left first when both seats end up held', () => {
    const { connect, guestIdOf, ratings } = setup();
    const [a, b] = [connect(), connect()];
    const [idA, idB] = [guestIdOf(a), guestIdOf(b)];
    if (idA === undefined || idB === undefined) throw new Error('no ids');
    a.receive(join());
    b.receive(join());
    a.close();
    b.close();
    expect(ratings.get(idA)).toMatchObject({ matches: 1, losses: 1 });
    expect(ratings.get(idB)).toMatchObject({ matches: 1, wins: 1 });
  });

  it('records the loss for the one who left first even when the held-guest cap is full', () => {
    const { connect, guestIdOf, ratings } = setup(1);
    const [a, b] = [connect(), connect()];
    const [idA, idB] = [guestIdOf(a), guestIdOf(b)];
    if (idA === undefined || idB === undefined) throw new Error('no ids');
    a.receive(join());
    b.receive(join());
    a.close();
    b.close();
    expect(ratings.get(idA)).toMatchObject({ matches: 1, losses: 1 });
    expect(ratings.get(idB)).toMatchObject({ matches: 1, wins: 1 });
  });

  it('drops at once beyond the cap on held guests', () => {
    const { connect, presence } = setup(1);
    const [a, b, c, d] = [connect(), connect(), connect(), connect()];
    a.receive(join());
    b.receive(join());
    c.receive(join());
    d.receive(join());
    a.close();
    expect(presence.counts().held).toBe(1);
    expect(b.sentOfType('match-ended')).toEqual([]);
    c.close();
    expect(presence.counts().held).toBe(1);
    expect(d.sentOfType('match-ended')).toMatchObject([{ reason: 'opponent-left' }]);
  });

  it('counts guests like the real open connections through a sequence of events', () => {
    const { connect, guestIdOf, presence, scheduler } = setup();
    const open = (all: readonly FakeConnection[]): number => all.filter((c) => !c.isClosed).length;
    const total = (): number => {
      const { online, queued, inMatch } = presence.counts();
      return online + queued + inMatch;
    };
    const [a, b, c, d] = [connect(), connect(), connect(), connect()];
    expect(presence.counts()).toEqual({ online: 4, queued: 0, inMatch: 0, held: 0 });
    a.receive(join());
    expect(presence.counts()).toEqual({ online: 3, queued: 1, inMatch: 0, held: 0 });
    b.receive(join());
    expect(presence.counts()).toEqual({ online: 2, queued: 0, inMatch: 2, held: 0 });
    c.receive(join());
    c.close();
    d.close();
    expect(presence.counts()).toEqual({ online: 0, queued: 0, inMatch: 2, held: 1 });
    expect(total()).toBe(open([a, b, c, d]));
    const c2 = connect();
    c2.receive(join(guestIdOf(c)));
    expect(presence.counts()).toEqual({ online: 0, queued: 1, inMatch: 2, held: 0 });
    a.close();
    scheduler.tick();
    // The match ended: b was closed by the server, a forfeited, c2 still queues.
    expect(presence.counts()).toEqual({ online: 0, queued: 1, inMatch: 0, held: 0 });
    expect(total()).toBe(open([a, b, c, d, c2]));
  });
});
