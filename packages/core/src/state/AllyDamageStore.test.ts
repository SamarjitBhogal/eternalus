import { describe, expect, it } from 'vitest';

import { AllyDamageStore } from './AllyDamageStore';

const entries = (store: AllyDamageStore): string[] => {
  const seen: string[] = [];
  store.forEach((team, lane, amount) => seen.push(`${team} ${lane} ${String(amount)}`));
  return seen;
};

describe('AllyDamageStore', () => {
  it('gives each lane its share of the damage a team took, per team', () => {
    const store = new AllyDamageStore();

    store.add('light', 'lane-0', 30);
    store.add('light', 'lane-2', 50);
    store.add('light', 'lane-0', 20);
    store.add('dark', 'lane-1', 10);

    expect(store.share('light', 'lane-0')).toBe(0.5);
    expect(store.share('light', 'lane-2')).toBe(0.5);
    expect(store.share('light', 'lane-1')).toBe(0);
    expect(store.share('dark', 'lane-1')).toBe(1);
  });

  it('shares nothing for a team that took no damage, and ignores amounts of 0', () => {
    const store = new AllyDamageStore();

    store.add('light', 'lane-0', 0);

    expect(store.share('light', 'lane-0')).toBe(0);
    expect(store.size).toBe(0);
  });

  it('clears one team only', () => {
    const store = new AllyDamageStore();
    store.add('light', 'lane-0', 5);
    store.add('dark', 'lane-0', 7);

    store.clear('light');

    expect(store.share('light', 'lane-0')).toBe(0);
    expect(entries(store)).toEqual(['dark lane-0 7']);
  });

  it("visits Light's tallies first, each team's lanes in first-hit order", () => {
    const store = new AllyDamageStore();
    store.add('dark', 'lane-2', 1);
    store.add('light', 'lane-1', 2);
    store.add('light', 'lane-0', 3);

    expect(entries(store)).toEqual(['light lane-1 2', 'light lane-0 3', 'dark lane-2 1']);
    expect(store.size).toBe(3);
  });
});
