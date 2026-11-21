import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { Simulation } from './Simulation';

/** A Magus (`entity-1`) and a training dummy (`entity-2`) 10 m east, the Magus told to attack. */
const duel = (seed = 3, distance = 10, mode?: 'melee') => {
  const sim = new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
    seed,
    logger: new NullLogger(),
    debug: TEST_DEBUG_CONFIG,
  });
  const spawn = (kind: string, definitionId: string, x: number, team: 'light' | 'dark') => {
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind,
      definitionId,
      team,
      at: { x, y: 0 },
      count: 1,
    });
  };
  spawn('magus', 'magus', 0, 'light');
  spawn('light-mob', 'training-dummy', distance, 'dark');
  sim.step();
  sim.enqueueCommand({
    type: 'attack-target',
    actorId: 'entity-1',
    targetId: 'entity-2',
    ...(mode && { mode }),
  });
  return sim;
};

describe('Simulation: ranged attacks', () => {
  it('melees a dummy 1 m away with the staff melee damage and no bolt in mode melee (DEC-308)', () => {
    const sim = duel(3, 1, 'melee');
    const hits: number[] = [];
    let bolts = 0;
    sim.on('damage-applied', ({ targetId, amount }) => {
      if (targetId === 'entity-2') hits.push(amount);
    });
    sim.on('entity-spawned', ({ kind }) => {
      if (kind === 'projectile') bolts += 1;
    });
    sim.step();
    sim.step();

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]).toBe(40);
    expect(bolts).toBe(0);
  });

  it('still fires a bolt without a mode at 10 m, melee reach unused', () => {
    const sim = duel(3, 10);
    sim.step();
    sim.step();

    expect(sim.snapshot().entities.some(({ kind }) => kind === 'projectile')).toBe(true);
  });

  it('fires a bolt when a staff Magus attacks a target in reach', () => {
    const sim = duel();
    sim.step();
    sim.step();

    const bolts = sim.snapshot().entities.filter(({ kind }) => kind === 'projectile');

    expect(bolts.length).toBeGreaterThan(0);
    expect(bolts[0]).toMatchObject({ team: 'light' });
  });

  it('kills a dummy at 10 m with bolts, credited to the staff', () => {
    const sim = duel();
    const hits: string[] = [];
    let killer: string | undefined;
    sim.on('damage-applied', ({ targetId, amount, source }) => {
      if (targetId === 'entity-2') hits.push(`${source.definitionId} ${String(amount)}`);
    });
    sim.on('entity-died', ({ entityId, killer: source }) => {
      if (entityId === 'entity-2') killer = source.definitionId;
    });

    for (let tick = 0; tick < 3000 && killer === undefined; tick += 1) sim.step();

    expect(killer).toBe('magus-staff');
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.every((hit) => hit.startsWith('magus-staff '))).toBe(true);
  });

  it('removes a bolt that hit with the cause consumed', () => {
    const sim = duel();
    const removed: string[] = [];
    sim.on('entity-removed', ({ entityId, cause }) => {
      if (entityId !== 'entity-2') removed.push(cause);
    });

    for (let tick = 0; tick < 20; tick += 1) sim.step();

    expect(removed).toContain('consumed');
  });

  it('is deterministic with bolts in flight: same seed and commands, same hash', () => {
    const play = () => {
      const sim = duel(9);
      for (let tick = 0; tick < 5; tick += 1) sim.step();
      return sim;
    };
    const first = play();

    expect(first.snapshot().entities.some(({ kind }) => kind === 'projectile')).toBe(true);
    expect(play().hash()).toBe(first.hash());
    expect(duel(9).hash()).not.toBe(first.hash());
  });

  it('flies a bolt that meets nothing to 100 m, holds it there for its end duration, then removes it (DEC-306)', () => {
    const sim = duel();
    sim.step();
    const shotOf = () => sim.snapshot().entities.find(({ kind }) => kind === 'projectile');
    const first = shotOf();
    expect(first).toBeDefined();
    const shotId = first?.id ?? '';
    const originX = first?.transform?.x ?? 0;
    // Nothing is left to hit.
    sim.enqueueCommand({ type: 'dev-remove-entity', entityId: 'entity-2' });

    const endedAt: number[] = [];
    let present = 0;
    let removedAfter: number | null = null;
    let hasDummy = false;
    for (let tick = 0; tick < 150; tick += 1) {
      sim.step();
      const shot = sim.snapshot().entities.find(({ id }) => id === shotId);
      if (shot === undefined) {
        removedAfter = present;
        break;
      }
      present += 1;
      if (shot.projectile?.ending !== null && shot.projectile?.ending !== undefined) {
        endedAt.push(shot.transform?.x ?? Number.NaN);
        if (!hasDummy) {
          // A body right on the ended shot: an ended shot hits nothing.
          sim.enqueueCommand({
            type: 'dev-spawn',
            kind: 'light-mob',
            definitionId: 'training-dummy',
            team: 'dark',
            at: { x: (shot.transform?.x ?? 0) + 0.5, y: 0 },
            count: 1,
          });
          hasDummy = true;
        }
      }
    }

    expect(endedAt.length).toBeGreaterThan(1);
    for (const x of endedAt) expect(x).toBeCloseTo(originX + 100, 6);
    expect(removedAfter).not.toBeNull();
    const dummy = sim
      .snapshot()
      .entities.find(
        ({ definitionId, team }) => definitionId === 'training-dummy' && team === 'dark',
      );
    expect(dummy).toBeDefined();
    expect(dummy?.health?.current).toBe(dummy?.health?.max);
    expect(dummy?.health?.max).toBeGreaterThan(0);
  });
});
