import { describe, expect, it } from 'vitest';

import type { Command } from './Command.types';
import { CommandQueue } from './CommandQueue';

const remove = (entityId: string): Command => ({ type: 'dev-remove-entity', entityId });

describe('CommandQueue', () => {
  it('drains commands in enqueue order and empties itself', () => {
    const queue = new CommandQueue();
    queue.enqueue(remove('entity-2'));
    queue.enqueue(remove('entity-1'));
    expect(queue.size).toBe(2);
    expect(queue.drain()).toEqual([remove('entity-2'), remove('entity-1')]);
    expect(queue.size).toBe(0);
    expect(queue.drain()).toEqual([]);
  });

  it('keeps commands enqueued during application for the next drain', () => {
    const queue = new CommandQueue();
    queue.enqueue(remove('entity-1'));
    const drained = queue.drain();
    queue.enqueue(remove('entity-2'));
    expect(drained).toEqual([remove('entity-1')]);
    expect(queue.drain()).toEqual([remove('entity-2')]);
  });
});
