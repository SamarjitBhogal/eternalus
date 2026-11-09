import { describe, expect, it } from 'vitest';

import { PublishedRoster } from './PublishedRoster';

type Tile = { readonly id: string; readonly health: number };

const tile = (id: string, health: number): Tile => ({ id, health });
const sameHealth = (last: Tile, next: Tile): boolean => last.health === next.health;

describe('PublishedRoster', () => {
  it('keeps the last array while no item changed', () => {
    const initial = [tile('gate', 10), tile('tower', 20)];
    const roster = new PublishedRoster(initial, sameHealth);

    expect(roster.update([tile('gate', 10), tile('tower', 20)])).toBe(initial);
  });

  it('publishes a new array that keeps each unchanged item', () => {
    const initial = [tile('gate', 10), tile('tower', 20)];
    const roster = new PublishedRoster(initial, sameHealth);

    const next = roster.update([tile('gate', 4), tile('tower', 20)]);

    expect(next).not.toBe(initial);
    expect(next).toEqual([tile('gate', 4), tile('tower', 20)]);
    expect(next[1]).toBe(initial[1]);
  });

  it('remembers what it published: the next unchanged roster is that array', () => {
    const roster = new PublishedRoster([tile('gate', 10)], sameHealth);
    const changed = roster.update([tile('gate', 4)]);

    expect(roster.update([tile('gate', 4)])).toBe(changed);
  });

  it('publishes a new array when the length changes, even with every kept item unchanged', () => {
    const initial = [tile('gate', 10), tile('tower', 20)];
    const roster = new PublishedRoster(initial, sameHealth);

    const shorter = roster.update([tile('gate', 10)]);
    const longer = roster.update([tile('gate', 10), tile('tower', 20)]);

    expect(shorter).not.toBe(initial);
    expect(shorter).toEqual([initial[0]]);
    expect(shorter[0]).toBe(initial[0]);
    expect(longer).not.toBe(shorter);
    expect(longer).toHaveLength(2);
    expect(longer[0]).toBe(initial[0]);
  });
});
