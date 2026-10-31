import { describe, expect, it } from 'vitest';

import { HordeStore } from './HordeStore';

const horde = (id: string, memberIds: readonly string[]) => ({
  id,
  team: 'light' as const,
  weightClass: 'light' as const,
  lane: 'lane-0',
  formationId: 'ranks',
  memberIds,
  progress: 0,
});

describe('HordeStore', () => {
  it('hands out ids from a counter and counts them for the hash', () => {
    const store = new HordeStore();

    expect([store.nextId(), store.nextId()]).toEqual(['horde-1', 'horde-2']);
    expect(store.issuedIds).toBe(2);
  });

  it('sorts members in string order, never numerically, and lets the lowest id lead', () => {
    const store = new HordeStore();

    const added = store.add(horde('horde-1', ['entity-10', 'entity-9', 'entity-11']));

    expect(added.memberIds).toEqual(['entity-10', 'entity-11', 'entity-9']);
    expect(added.leaderId).toBe('entity-10');
    expect(store.hordeOf('entity-10')?.id).toBe('horde-1');
    expect(store.get('horde-1')).toBe(added);
    expect(store.size).toBe(1);
  });

  it('promotes the next lowest id when the leader leaves and drops an emptied horde', () => {
    const store = new HordeStore();
    store.add(horde('horde-1', ['entity-1', 'entity-2']));

    expect(store.removeMember('entity-1')?.leaderId).toBe('entity-2');
    expect(store.hordeOf('entity-1')).toBeUndefined();
    expect(store.removeMember('entity-2')?.memberIds).toEqual([]);
    expect(store.get('horde-1')).toBeUndefined();
    expect(store.removeMember('entity-3')).toBeUndefined();
  });

  it('rejects a taken id, an empty horde and a member already in a horde', () => {
    const store = new HordeStore();
    store.add(horde('horde-1', ['entity-1']));

    expect(() => store.add(horde('horde-1', ['entity-2']))).toThrow('already in the store');
    expect(() => store.add(horde('horde-2', []))).toThrow('at least one member');
    expect(() => store.add(horde('horde-3', ['entity-1']))).toThrow('already in a horde');
  });

  it('sets progress and visits hordes in creation order', () => {
    const store = new HordeStore();
    store.add(horde('horde-2', ['entity-2']));
    store.add(horde('horde-1', ['entity-1']));

    store.setProgress('horde-1', 3);
    store.setProgress('nobody', 9);
    const visited: string[] = [];
    store.forEach((each) => visited.push(`${each.id}:${String(each.progress)}`));

    expect(visited).toEqual(['horde-2:0', 'horde-1:3']);
  });
});
