import { describe, expect, it } from 'vitest';

import { DefenderDamageStore } from './DefenderDamageStore';

describe('DefenderDamageStore', () => {
  it('sums each Legend damage per set, ignores no damage, and forgets a set once taken', () => {
    const store = new DefenderDamageStore();
    store.add('set-1', 'legend-a', 30);
    store.add('set-1', 'legend-b', 10);
    store.add('set-1', 'legend-a', 20);
    store.add('set-2', 'legend-b', 0);
    store.add('set-2', 'legend-b', 5);
    const seen: unknown[] = [];
    store.forEach((set, legend, amount) => seen.push([set, legend, amount]));

    expect(seen).toEqual([
      ['set-1', 'legend-a', 50],
      ['set-1', 'legend-b', 10],
      ['set-2', 'legend-b', 5],
    ]);
    expect([...store.take('set-1')]).toEqual([
      ['legend-a', 50],
      ['legend-b', 10],
    ]);
    expect(store.size).toBe(1);
    expect([...store.take('set-1')]).toEqual([]);
  });
});
