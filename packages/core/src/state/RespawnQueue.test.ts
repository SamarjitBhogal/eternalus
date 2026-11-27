import { describe, expect, it } from 'vitest';

import type { Legend } from '../entities/Legend';
import { RespawnQueue } from './RespawnQueue';

/** The queue reads only a Legend's id. */
const legend = (id: string): Legend => ({ id }) as unknown as Legend;

const idsOf = (entries: readonly { readonly legend: Legend }[]): string[] =>
  entries.map((entry) => entry.legend.id);

describe('RespawnQueue', () => {
  it('starts empty', () => {
    const queue = new RespawnQueue();

    expect(queue.size).toBe(0);
    expect(queue.has('entity-1')).toBe(false);
    expect(queue.legendOf('entity-1')).toBeUndefined();
  });

  it('holds the queued Legend object itself and answers has() and legendOf()', () => {
    const queue = new RespawnQueue();
    const waiting = legend('entity-1');

    queue.add(waiting, 'light', 300);

    expect(queue.size).toBe(1);
    expect(queue.has('entity-1')).toBe(true);
    expect(queue.legendOf('entity-1')).toBe(waiting);
  });

  it('rejects a Legend that is already waiting', () => {
    const queue = new RespawnQueue();
    queue.add(legend('entity-1'), 'light', 300);

    expect(() => {
      queue.add(legend('entity-1'), 'light', 400);
    }).toThrow(/already waiting/);
  });

  it('hands out only the due entries, in death order, and drops them', () => {
    const queue = new RespawnQueue();
    queue.add(legend('entity-2'), 'light', 300);
    queue.add(legend('entity-1'), 'dark', 100);
    queue.add(legend('entity-3'), 'light', 300);

    expect(queue.takeDue(99)).toEqual([]);
    expect(idsOf(queue.takeDue(300))).toEqual(['entity-2', 'entity-1', 'entity-3']);
    expect(queue.size).toBe(0);
  });

  it('keeps the entries that are not due yet', () => {
    const queue = new RespawnQueue();
    queue.add(legend('entity-1'), 'light', 100);
    queue.add(legend('entity-2'), 'light', 300);

    expect(idsOf(queue.takeDue(100))).toEqual(['entity-1']);
    expect(queue.has('entity-2')).toBe(true);
  });

  it('visits entries in death order', () => {
    const queue = new RespawnQueue();
    queue.add(legend('entity-2'), 'light', 300);
    queue.add(legend('entity-1'), 'light', 100);
    const seen: string[] = [];

    queue.forEach((entry) => seen.push(entry.legend.id));

    expect(seen).toEqual(['entity-2', 'entity-1']);
  });

  it('keeps the XP a waiting Legend is owed, in order, and hands it out with the entry (DEC-186)', () => {
    const queue = new RespawnQueue();
    queue.add(legend('entity-1'), 'light', 100);
    const tower = {
      cause: 'structure-destroyed',
      victimId: 'entity-7',
      victimTeam: 'dark',
      xp: 120,
    } as const;
    const boss = {
      cause: 'team-kill',
      victimId: 'entity-8',
      victimTeam: 'neutral',
      xp: 50,
      maxLevels: 1,
    } as const;

    queue.owe('entity-1', tower);
    queue.owe('entity-1', boss);

    expect(queue.takeDue(100)[0]?.owedXp).toEqual([tower, boss]);
    expect(() => {
      queue.owe('entity-1', tower);
    }).toThrow(/not waiting/);
  });
});
