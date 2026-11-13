import { describe, expect, it } from 'vitest';

import { RespawnQueue } from './RespawnQueue';
import type { RespawnEntry } from './RespawnQueue.types';

const entry = (entityId: string, returnsAtTick: number): RespawnEntry => ({
  entityId,
  kind: 'warrior',
  definitionId: 'warrior',
  team: 'light',
  xp: 10,
  level: 2,
  healthMax: 100,
  aetherMax: 50,
  returnsAtTick,
});

describe('RespawnQueue', () => {
  it('starts empty', () => {
    const queue = new RespawnQueue();

    expect(queue.size).toBe(0);
    expect(queue.has('entity-1')).toBe(false);
  });

  it('holds queued Legends and answers has()', () => {
    const queue = new RespawnQueue();

    queue.add(entry('entity-1', 300));

    expect(queue.size).toBe(1);
    expect(queue.has('entity-1')).toBe(true);
  });

  it('rejects a Legend that is already waiting', () => {
    const queue = new RespawnQueue();
    queue.add(entry('entity-1', 300));

    expect(() => {
      queue.add(entry('entity-1', 400));
    }).toThrow(/already waiting/);
  });

  it('hands out only the due entries, in death order, and drops them', () => {
    const queue = new RespawnQueue();
    queue.add(entry('entity-2', 300));
    queue.add(entry('entity-1', 100));
    queue.add(entry('entity-3', 300));

    expect(queue.takeDue(99)).toEqual([]);
    expect(queue.takeDue(300).map(({ entityId }) => entityId)).toEqual([
      'entity-2',
      'entity-1',
      'entity-3',
    ]);
    expect(queue.size).toBe(0);
  });

  it('keeps the entries that are not due yet', () => {
    const queue = new RespawnQueue();
    queue.add(entry('entity-1', 100));
    queue.add(entry('entity-2', 300));

    expect(queue.takeDue(100).map(({ entityId }) => entityId)).toEqual(['entity-1']);
    expect(queue.has('entity-2')).toBe(true);
  });

  it('visits entries in death order', () => {
    const queue = new RespawnQueue();
    queue.add(entry('entity-2', 300));
    queue.add(entry('entity-1', 100));
    const seen: string[] = [];

    queue.forEach(({ entityId }) => seen.push(entityId));

    expect(seen).toEqual(['entity-2', 'entity-1']);
  });
});
