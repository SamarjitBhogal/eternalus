import { describe, expect, it } from 'vitest';
import { Abilities } from '../../components/Abilities';
import { Health } from '../../components/Health';
import { PlayerSnapshotter } from '../../state/PlayerSnapshotter';
import { starterArena } from '../__fixtures__/starterArena';

describe('starter ultimate resources', () => {
  it('awards a kill and an assist to their actual contributors and exposes the meter', () => {
    const a = starterArena();
    const killer = a.spawn('warrior', { position: { x: 20, y: 20 }, team: 'light' });
    const helper = a.spawn('magus', { position: { x: 30, y: 20 }, team: 'light' });
    const victim = a.spawn('sentinel', { position: { x: 40, y: 20 }, team: 'dark' });
    a.damage.apply(a.state, victim.id, 10, {
      attackerId: helper.id,
      kind: 'weapon',
      definitionId: 'staff',
    });
    a.damage.apply(a.state, victim.id, 10000, {
      attackerId: killer.id,
      kind: 'weapon',
      definitionId: 'sword',
    });
    expect(killer.getComponent(Abilities).slot('ability-4')?.charge).toBe(0.25);
    expect(helper.getComponent(Abilities).slot('ability-4')?.charge).toBe(0.12);
    expect(
      new PlayerSnapshotter(a.validator)
        .snapshotOf(a.state, killer)
        ?.slots.find((slot) => slot.slot === 'ability-4')?.charge,
    ).toBe(0.25);
  });
  it('recognizes the Phase 3 capture-boss stand-in and reaches exactly full charge from its health', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 20, y: 20 }, team: 'light' });
    const boss = a.spawn('capture-point-boss', { position: { x: 40, y: 20 }, team: 'neutral' });
    const hit = boss.getComponent(Health).max / 10;
    for (let i = 0; i < 10; i++)
      a.damage.apply(a.state, boss.id, hit, {
        attackerId: hero.id,
        kind: 'ability',
        definitionId: 'test-hit',
      });
    expect(hero.getComponent(Abilities).slot('ability-4')?.charge).toBe(1);
  });
  it('does not refill passively or during lockout, and loses charge on death', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 20, y: 20 }, team: 'light' });
    const enemy = a.spawn('sentinel', { position: { x: 60, y: 20 }, team: 'dark' });
    a.run(60);
    expect(hero.getComponent(Abilities).slot('ability-4')?.charge).toBe(0);
    a.charge(hero.id);
    a.cast(hero.id, 'ability-4');
    a.run();
    a.damage.apply(a.state, enemy.id, 10000, {
      attackerId: hero.id,
      kind: 'weapon',
      definitionId: 'sword',
    });
    expect(hero.getComponent(Abilities).slot('ability-4')?.charge).toBe(0);
    a.charge(hero.id);
    a.damage.apply(a.state, hero.id, 10000, {
      attackerId: null,
      kind: 'environment',
      definitionId: 'test-death',
    });
    expect(hero.getComponent(Abilities).slot('ability-4')?.charge).toBe(0.85);
  });
});
