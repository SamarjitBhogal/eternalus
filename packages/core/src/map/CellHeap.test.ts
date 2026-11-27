import { describe, expect, it } from 'vitest';

import { CellHeap } from './CellHeap';

describe('CellHeap', () => {
  it('pops cells by key, ties by index, and moves a cell up when its key drops', () => {
    const heap = new CellHeap(5);
    // Cells 2 and 1 tie on key 3; 2 is queued first, but the lower index pops first (11 §5).
    heap.push(2, 3);
    heap.push(0, 5);
    heap.push(1, 3);
    heap.push(3, 9);
    heap.push(3, 0);

    expect(heap.size).toBe(4);
    expect([heap.pop(), heap.pop(), heap.pop(), heap.pop(), heap.pop()]).toEqual([3, 1, 2, 0, -1]);
    heap.push(4, 1);
    heap.clear();
    expect(heap.size).toBe(0);
  });
});
