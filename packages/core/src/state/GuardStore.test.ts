import { describe, expect, it } from 'vitest';

import { GuardStore } from './GuardStore';

const POST = {
  id: 'entity-1:0',
  homeId: 'entity-1',
  team: 'light',
  mobId: 'light-guard',
  row: 0,
  indexInRow: 0,
  postX: 1,
  postY: 2,
  homeX: 0,
  homeY: 0,
  homeRadius: 1,
  leashRadius: 8,
  leashTolerance: 2,
  respawnTicks: 3600,
} as const;

describe('GuardStore', () => {
  it('adds an empty post, fills it, finds it by its guard and vacates it', () => {
    const store = new GuardStore();
    store.add(POST);
    expect(store.size).toBe(1);

    store.fill(0, 'entity-9');
    expect(store.slotOf('entity-9')).toMatchObject({ id: 'entity-1:0', guardId: 'entity-9' });

    store.vacate(0, 120);
    expect(store.slotOf('entity-9')).toBeUndefined();
    const seen: unknown[] = [];
    store.forEach((slot) => seen.push([slot.guardId, slot.respawnAtTick]));
    expect(seen).toEqual([[null, 120]]);
  });

  it('refuses a post that does not exist', () => {
    expect(() => {
      new GuardStore().fill(3, 'entity-9');
    }).toThrow(RangeError);
  });
});
