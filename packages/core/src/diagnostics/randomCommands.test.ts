import { describe, expect, it } from 'vitest';

import type { Snapshot } from '../state/Snapshot.types';
import { SeededRandom } from '../utils/SeededRandom';
import { randomCommand } from './randomCommands';

const snapshotWith = (...ids: string[]): Snapshot => ({
  tick: 0,
  phase: 'countdown',
  entities: ids.map((id) => ({
    id,
    kind: 'walker',
    family: 'test',
    definitionId: 'walker',
    team: 'light',
    transform: null,
    health: null,
  })),
});

const stream = (seed: number, snapshot: Snapshot, count: number): unknown[] => {
  const rng = new SeededRandom(seed);
  return Array.from({ length: count }, () => randomCommand(rng, snapshot, ['walker']));
};

describe('randomCommand', () => {
  it('gives the same stream for the same seed and snapshot', () => {
    const snapshot = snapshotWith('entity-1', 'entity-2');
    expect(stream(3, snapshot, 200)).toEqual(stream(3, snapshot, 200));
  });

  it('covers every command it knows and aims mostly at live entities', () => {
    const commands = stream(3, snapshotWith('entity-1', 'entity-2'), 400) as {
      type: string;
      actorId?: string;
      entityId?: string;
    }[];
    expect(new Set(commands.map(({ type }) => type))).toEqual(
      new Set(['move', 'stop', 'dev-remove-entity', 'dev-spawn']),
    );
    const targets = commands.flatMap(({ actorId, entityId }) => actorId ?? entityId ?? []);
    const live = targets.filter((id) => id === 'entity-1' || id === 'entity-2');
    expect(live.length / targets.length).toBeGreaterThan(0.8);
    expect(live.length).toBeLessThan(targets.length);
  });

  it('aims at missing entities when nothing is alive', () => {
    const commands = stream(9, snapshotWith(), 50) as { actorId?: string; entityId?: string }[];
    const targets = commands.flatMap(({ actorId, entityId }) => actorId ?? entityId ?? []);
    expect(targets.every((id) => id.startsWith('entity-missing-'))).toBe(true);
  });
});
