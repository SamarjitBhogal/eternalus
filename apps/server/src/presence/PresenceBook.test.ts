import { MemoryLogger } from '@eternalus/core';
import { ClientMessageParser } from '@eternalus/protocol';
import { describe, expect, it } from 'vitest';
import { DuelGateway } from '../gateway/DuelGateway';
import { TokenBucket } from '../limits/TokenBucket';
import { DuelHost } from '../match/DuelHost';
import { FakeDuelSimulation } from '../match/FakeDuelSimulation';
import { DuelQueue } from '../queue/DuelQueue';
import { FakeClock } from '../time/FakeClock';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { FakeConnection } from '../transport/FakeConnection';
import { PresenceBook } from './PresenceBook';
import { MAX_HELD_GUESTS, RECONNECT_WINDOW_MS } from './PresenceBook.constants';

const join = (guestId?: string): string =>
  JSON.stringify({
    type: 'queue-join',
    name: 'Ana',
    ...(guestId === undefined ? {} : { guestId }),
  });

function setup(maxHeldGuests = MAX_HELD_GUESTS) {
  const scheduler = new FakeTickScheduler();
  const host = new DuelHost({
    factory: { create: () => new FakeDuelSimulation() },
    scheduler,
    tickIntervalMs: 33,
    versusMs: 0,
    logger: new MemoryLogger(),
  });
  const queue = new DuelQueue(host);
  let issued = 0;
  const presence = new PresenceBook({
    queue,
    host,
    scheduler,
    reconnectWindowMs: RECONNECT_WINDOW_MS,
    maxHeldGuests,
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
    gateway.accept(connection);
    return connection;
  };
  const guestIdOf = (connection: FakeConnection): string | undefined =>
    connection.sentOfType('welcome').at(-1)?.guestId;
  return { presence, scheduler, connect, guestIdOf };
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

  it('drops a queued guest after the window: the id is then unknown', () => {
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
