import { describe, expect, it } from 'vitest';

import { CellHeap } from './CellHeap';

describe('CellHeap', () => {
  it('pops cells by key, ties by index, and moves a cell up when its key drops', () => {
    const keys = [5, 3, 3, 9, 1];
    const heap = new CellHeap(keys.length, (a, b) => {
      const keyA = keys[a] ?? 0;
      const keyB = keys[b] ?? 0;
      return keyA < keyB || (keyA === keyB && a < b);
    });
    for (const cell of [0, 1, 2, 3]) {
      heap.push(cell);
    }
    keys[3] = 0;
    heap.push(3);

    expect(heap.size).toBe(4);
    expect([heap.pop(), heap.pop(), heap.pop(), heap.pop(), heap.pop()]).toEqual([3, 1, 2, 0, -1]);
    heap.push(4);
    heap.clear();
    expect(heap.size).toBe(0);
  });
});
