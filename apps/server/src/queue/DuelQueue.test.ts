import { describe, expect, it } from 'vitest';
import { PlayerRatings } from '../rating/PlayerRatings';
import { FakeClock } from '../time/FakeClock';
import { FakeTickScheduler } from '../time/FakeTickScheduler';
import { FakeConnection } from '../transport/FakeConnection';
import { QUEUE_SWEEP_MS, QUEUE_TIMEOUT_MS } from './DuelQueue.constants';
import { DuelQueue } from './DuelQueue';

type Pair = readonly [string, string];

function setup() {
  const started: Pair[] = [];
  const names: Record<string, string> = {};
  const ratings = new PlayerRatings();
  const clock = new FakeClock();
  const scheduler = new FakeTickScheduler();
  const queue = new DuelQueue({
    starter: { start: (light, dark) => started.push([light.guestId, dark.guestId]) },
    ratings,
    clock,
    scheduler,
  });
  const connections = new Map<string, FakeConnection>();
  const join = (id: string, name = 'n'): FakeConnection => {
    const connection = connections.get(id) ?? new FakeConnection();
    connections.set(id, connection);
    names[id] = name;
    queue.join(connection, name, id);
    return connection;
  };
  // Waits `ms`, one sweep at a time, like the real scheduler.
  const wait = (ms: number): void => {
    for (let waited = 0; waited < ms; waited += QUEUE_SWEEP_MS) {
      clock.advance(QUEUE_SWEEP_MS);
      scheduler.tick();
    }
  };
  return { queue, started, ratings, join, wait, connections };
}

/** Rates `id` far above or below 1500 by letting it win or lose against a throwaway player. */
function rate(ratings: PlayerRatings, id: string, wins: number, losses = 0): void {
  for (let i = 0; i < wins; i += 1) ratings.recordMatch(id, `x${String(i)}`, 'light');
  for (let i = 0; i < losses; i += 1) ratings.recordMatch(id, `y${String(i)}`, 'dark');
}

describe('DuelQueue', () => {
  it('makes the first player wait', () => {
    const { join, started } = setup();
    expect(join('a').sent).toEqual([{ type: 'queue-waiting' }]);
    expect(started).toEqual([]);
  });

  it('pairs the second equal-rated player with the first, first-come as light', () => {
    const { join, started } = setup();
    join('a');
    const b = join('b');
    expect(started).toEqual([['a', 'b']]);
    expect(b.sent).toEqual([]);
  });

  it('hands the pair over with the names they joined with', () => {
    const names: string[] = [];
    const queue = new DuelQueue({
      starter: { start: (light, dark) => names.push(light.name, dark.name) },
      ratings: new PlayerRatings(),
      clock: new FakeClock(),
      scheduler: new FakeTickScheduler(),
    });
    queue.join(new FakeConnection(), 'Ana', 'a');
    queue.join(new FakeConnection(), 'Ben', 'b');
    expect(names).toEqual(['Ana', 'Ben']);
  });

  it('ignores a second join by a waiting player', () => {
    const { join, started } = setup();
    const a = join('a');
    join('a');
    expect(started).toEqual([]);
    expect(a.sent).toHaveLength(1);
  });

  it('forgets a player who leaves, so the next one waits again', () => {
    const { join, queue, connections, started } = setup();
    join('a');
    queue.leave(connections.get('a') ?? new FakeConnection());
    const b = join('b');
    expect(started).toEqual([]);
    expect(b.sent).toEqual([{ type: 'queue-waiting' }]);
  });

  it('ignores a leave by someone who is not waiting', () => {
    const { join, queue, started } = setup();
    join('a');
    queue.leave(new FakeConnection());
    join('b');
    expect(started).toHaveLength(1);
  });

  it('never pairs a player who left, even after a long wait', () => {
    const { join, queue, connections, started, wait } = setup();
    join('a');
    queue.leave(connections.get('a') ?? new FakeConnection());
    const b = join('b');
    wait(QUEUE_TIMEOUT_MS * 2);
    expect(started).toEqual([]);
    expect(b.sentOfType('match-found')).toEqual([]);
  });

  it('hands a waiting slot to a reconnecting connection, keeping the rating and the wait', () => {
    const { join, queue, connections, started, wait, ratings } = setup();
    rate(ratings, 'a', 4);
    const old = join('a');
    const fresh = new FakeConnection();
    queue.replace(old, fresh);
    expect(fresh.sent).toEqual([{ type: 'queue-waiting' }]);
    expect(queue.isWaiting(old)).toBe(false);
    expect(queue.isWaiting(fresh)).toBe(true);
    join('b');
    wait(QUEUE_TIMEOUT_MS);
    expect(started).toEqual([['a', 'b']]);
    expect(connections.size).toBe(2);
  });

  it('pairs close ratings first, not by arrival order', () => {
    const { join, started, ratings, wait } = setup();
    rate(ratings, 'a1', 0, 2);
    rate(ratings, 'a2', 0, 2);
    rate(ratings, 'b1', 2);
    rate(ratings, 'b2', 2);
    join('a1');
    join('b1');
    join('a2');
    join('b2');
    wait(QUEUE_TIMEOUT_MS);
    expect(started.map((pair) => [...pair].sort())).toEqual([
      ['a1', 'a2'],
      ['b1', 'b2'],
    ]);
  });

  it('does not pair players 300 apart at first, but does after enough waiting', () => {
    const { join, started, ratings, wait } = setup();
    rate(ratings, 'strong', 6);
    expect(ratings.get('strong').rating - 1500).toBeGreaterThan(300);
    join('fresh');
    join('strong');
    wait(QUEUE_SWEEP_MS);
    expect(started).toEqual([]);
    wait(QUEUE_TIMEOUT_MS);
    expect(started).toEqual([['fresh', 'strong']]);
  });

  it('pairs everyone within the timeout, leaving only the odd one out waiting', () => {
    const { join, queue, connections, started, ratings, wait } = setup();
    const ids = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    ids.forEach((id, index) => {
      rate(ratings, id, index, 6 - index);
      join(id);
    });
    wait(QUEUE_TIMEOUT_MS);
    expect(started).toHaveLength(3);
    const waiting = ids.filter((id) => {
      const connection = connections.get(id);
      return connection !== undefined && queue.isWaiting(connection);
    });
    expect(waiting).toHaveLength(1);
    expect(new Set(started.flat()).size).toBe(6);
  });
});
