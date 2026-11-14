import { describe, expect, it } from 'vitest';
import { Simulation } from '../Simulation';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NullLogger } from '../diagnostics/NullLogger';
import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import type { AbilitySlot } from '../commands/Command.types';

const setup = () => {
  const simulation = new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
    seed: 123,
    logger: new NullLogger(),
    debug: TEST_DEBUG_CONFIG,
  });
  for (const [kind, definitionId, x, team] of [
    ['magus', 'magus', 0, 'light'],
    ['light-mob', 'training-dummy', 6, 'dark'],
  ] as const)
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind,
      definitionId,
      at: { x, y: 0 },
      team,
      count: 1,
    });
  simulation.step();
  const cast = (slot: AbilitySlot) => {
    simulation.enqueueCommand({
      type: 'cast-ability',
      actorId: 'entity-1',
      slot,
      aim: { point: { x: 0, y: 0 }, targetId: null },
    });
    simulation.step();
  };
  return { simulation, cast };
};

describe('Magus starter kit in the real pipeline', () => {
  it('keeps Nova explicitly visual without damage, aether cost or a real cast event', () => {
    const { simulation, cast } = setup();
    const previews: string[] = [],
      casts: string[] = [];
    simulation.on('ability-previewed', ({ abilityId }) => previews.push(abilityId));
    simulation.on('ability-cast', ({ abilityId }) => casts.push(abilityId));
    const targetBefore = simulation.snapshot().entities.find((e) => e.id === 'entity-2')?.health;
    cast('ability-4');
    cast('ability-4');
    expect(previews).toEqual(['nova', 'nova']);
    expect(casts).toEqual([]);
    expect(simulation.snapshot().entities.find((e) => e.id === 'entity-1')?.aether?.current).toBe(
      140,
    );
    expect(simulation.snapshot().entities.find((e) => e.id === 'entity-2')?.health).toEqual(
      targetBefore,
    );
    expect(simulation.snapshot().entities.some((e) => e.kind === 'effect-zone')).toBe(false);
  });
  it('fires a travelling staff bolt and damages only when it reaches the target', () => {
    const { simulation } = setup();
    const shots: string[] = [];
    simulation.on('projectile-fired', ({ entityId }) => shots.push(entityId));
    const before = simulation.snapshot().entities.find((e) => e.id === 'entity-2')?.health?.current;
    simulation.enqueueCommand({ type: 'attack-target', actorId: 'entity-1', targetId: 'entity-2' });
    simulation.step();
    expect(shots).toHaveLength(1);
    expect(simulation.snapshot().entities.find((e) => e.id === 'entity-2')?.health?.current).toBe(
      before,
    );
    for (let tick = 0; tick < 10; tick += 1) simulation.step();
    expect(simulation.snapshot().entities.find((e) => e.id === 'entity-2')?.health?.current).toBe(
      (before ?? 0) - 40,
    );
    expect(simulation.snapshot().entities.some((e) => e.kind === 'projectile')).toBe(false);
  });
  it('rejects another Imbue during cooldown without spending again or announcing a cast', () => {
    const { simulation, cast } = setup();
    const casts: string[] = [];
    simulation.on('ability-cast', ({ abilityId }) => casts.push(abilityId));
    cast('ability-1');
    const spent =
      simulation.snapshot().entities.find((e) => e.id === 'entity-1')?.aether?.current ?? 0;
    cast('ability-1');
    expect(casts).toEqual(['imbue']);
    expect(spent).toBe(95);
    expect(
      simulation.snapshot().entities.find((e) => e.id === 'entity-1')?.aether?.current,
    ).toBeCloseTo(spent + 2 / 30);
  });
  it('creates Sanctuary at the caster and retires it after its authored lifetime', () => {
    const { simulation, cast } = setup();
    cast('ability-3');
    expect(simulation.snapshot().entities.filter((e) => e.kind === 'effect-zone')).toHaveLength(1);
    for (let tick = 0; tick < 150; tick += 1) simulation.step();
    expect(simulation.snapshot().entities.filter((e) => e.kind === 'effect-zone')).toHaveLength(0);
  });
  it('hashes identical commands, casts and projectile travel identically', () => {
    const a = setup(),
      b = setup();
    a.cast('ability-1');
    b.cast('ability-1');
    for (const { simulation } of [a, b])
      simulation.enqueueCommand({
        type: 'attack-target',
        actorId: 'entity-1',
        targetId: 'entity-2',
      });
    for (let tick = 0; tick < 12; tick += 1) {
      a.simulation.step();
      b.simulation.step();
      expect(a.simulation.hash()).toBe(b.simulation.hash());
    }
  });
});
