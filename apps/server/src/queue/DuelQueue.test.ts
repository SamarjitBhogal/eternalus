import { describe, expect, it } from 'vitest';
import { FakeConnection } from '../transport/FakeConnection';
import type { ClientConnection } from '../transport/ClientConnection.types';
import { DuelQueue } from './DuelQueue';

type Pair = readonly [ClientConnection, ClientConnection];

function setup(): { queue: DuelQueue; started: Pair[] } {
  const started: Pair[] = [];
  const queue = new DuelQueue({
    start: (light, dark) => started.push([light.connection, dark.connection]),
  });
  return { queue, started };
}

describe('DuelQueue', () => {
  it('makes the first player wait', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    queue.join(a, 'n');
    expect(a.sent).toEqual([{ type: 'queue-waiting' }]);
    expect(started).toEqual([]);
  });

  it('pairs the second player with the first, first-come as light', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    queue.join(a, 'n');
    queue.join(b, 'n');
    expect(started).toEqual([[a, b]]);
    expect(b.sent).toEqual([]);
  });

  it('hands the pair over with the names they joined with', () => {
    const names: string[] = [];
    const queue = new DuelQueue({ start: (light, dark) => names.push(light.name, dark.name) });
    queue.join(new FakeConnection(), 'Ana');
    queue.join(new FakeConnection(), 'Ben');
    expect(names).toEqual(['Ana', 'Ben']);
  });

  it('ignores a second join by the waiting player', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    queue.join(a, 'n');
    queue.join(a, 'n');
    expect(started).toEqual([]);
    expect(a.sent).toHaveLength(1);
  });

  it('forgets a player who leaves, so the next one waits again', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    queue.join(a, 'n');
    queue.leave(a);
    queue.join(b, 'n');
    expect(started).toEqual([]);
    expect(b.sent).toEqual([{ type: 'queue-waiting' }]);
  });

  it('ignores a leave by someone who is not waiting', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    queue.join(a, 'n');
    queue.leave(new FakeConnection());
    queue.join(new FakeConnection(), 'n');
    expect(started).toHaveLength(1);
  });

  it('lets a player join again right after leaving, and pairs them with the next one', () => {
    const { queue, started } = setup();
    const a = new FakeConnection();
    const b = new FakeConnection();
    queue.join(a, 'n');
    queue.leave(a);
    queue.join(a, 'n');
    queue.join(b, 'n');
    expect(a.sentOfType('queue-waiting')).toHaveLength(2);
    expect(started).toEqual([[a, b]]);
  });

  it('keeps nobody waiting once a pair is made, so the third player waits alone', () => {
    const { queue, started } = setup();
    const [a, b, c] = [new FakeConnection(), new FakeConnection(), new FakeConnection()];
    queue.join(a, 'n');
    queue.join(b, 'n');
    queue.leave(a);
    queue.join(c, 'n');
    expect(started).toHaveLength(1);
    expect(c.sent).toEqual([{ type: 'queue-waiting' }]);
  });
});
