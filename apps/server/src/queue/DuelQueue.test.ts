import { describe, expect, it } from 'vitest';
import { FakeConnection } from '../transport/FakeConnection';
import type { ClientConnection } from '../transport/ClientConnection.types';
import { DuelQueue } from './DuelQueue';

type Pair = readonly [ClientConnection, ClientConnection];

function setup(): { queue: DuelQueue; started: Pair[] } {
  const started: Pair[] = [];
  const queue = new DuelQueue({ start: (light, dark) => started.push([light, dark]) });
  return { queue, started };
}

describe('DuelQueue', () => {
  it('makes the first player wait', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    queue.join(a);
    expect(a.sent).toEqual([{ type: 'queue-waiting' }]);
    expect(started).toEqual([]);
  });

  it('pairs the second player with the first, first-come as light', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    queue.join(a);
    queue.join(b);
    expect(started).toEqual([[a, b]]);
    expect(b.sent).toEqual([]);
  });

  it('ignores a second join by the waiting player', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    queue.join(a);
    queue.join(a);
    expect(started).toEqual([]);
    expect(a.sent).toHaveLength(1);
  });

  it('forgets a player who leaves, so the next one waits again', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    queue.join(a);
    queue.leave(a);
    queue.join(b);
    expect(started).toEqual([]);
    expect(b.sent).toEqual([{ type: 'queue-waiting' }]);
  });

  it('ignores a leave by someone who is not waiting', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    queue.join(a);
    queue.leave(new FakeConnection());
    queue.join(new FakeConnection());
    expect(started).toHaveLength(1);
  });
});
