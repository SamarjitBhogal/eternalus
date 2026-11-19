import { describe, expect, it } from 'vitest';
import { Abilities } from '../../components/Abilities';
import { Health } from '../../components/Health';
import { StatusEffects } from '../../components/StatusEffects';
import { Transform } from '../../components/Transform';
import { AttackTargetHandler } from '../../commands/handlers/AttackTargetHandler';
import { starterArena } from '../__fixtures__/starterArena';

describe('Warrior starter gameplay', () => {
  it('keeps a fired blade on its original team after the caster leaves the world', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 50, y: 50 }, team: 'light' });
    const friend = a.spawn('sentinel', { position: { x: 54, y: 50 }, team: 'light' });
    const enemy = a.spawn('sentinel', { position: { x: 59, y: 50 }, team: 'dark' });
    a.cast(hero.id, 'ability-3');
    a.run();
    a.state.entities.remove(hero.id, 'consumed');
    a.run(15);
    expect(friend.getComponent(Health).current).toBe(friend.getComponent(Health).max);
    expect(enemy.getComponent(Health).max - enemy.getComponent(Health).current).toBe(80);
  });
  it('closes Fury repeats immediately when its buff is removed and emits recasts separately', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 50, y: 50 }, team: 'light' });
    const casts: string[] = [];
    a.state.events.on('ability-cast', ({ abilityId }) => casts.push(abilityId));
    a.state.events.on('ability-recast', ({ abilityId }) => casts.push(`repeat:${abilityId}`));
    a.charge(hero.id);
    a.cast(hero.id, 'ability-4');
    a.run();
    a.cast(hero.id, 'ability-4');
    a.run();
    expect(casts).toEqual(['fury', 'repeat:fury']);
    a.statuses.remove(a.state, hero.id, 'fury');
    a.run();
    expect(a.cast(hero.id, 'ability-4')).toBe('not-charged');
    expect(hero.getComponent(Abilities).slot('ability-4')?.recastUntilTick).toBe(0);
  });
  it('Veil prevents enemy acquisition and breaks on damage', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 50, y: 50 }, team: 'light' });
    const enemy = a.spawn('warrior', { position: { x: 51, y: 50 }, team: 'dark' });
    expect(a.cast(hero.id, 'ability-2')).toBeNull();
    a.run();
    expect(a.state.entities.isVisibleToTeam('dark', hero.id)).toBe(false);
    expect(a.state.entities.isVisibleToTeam('light', hero.id)).toBe(true);
    expect(hero.getComponent(StatusEffects).has('invisible')).toBe(true);
    expect(
      new AttackTargetHandler().handle(
        { type: 'attack-target', actorId: enemy.id, targetId: hero.id },
        { state: a.state, factory: a.factory },
      ),
    ).toBe('invalid-target');
    a.damage.apply(a.state, hero.id, 10, {
      attackerId: enemy.id,
      kind: 'ability',
      definitionId: 'test-hit',
    });
    expect(a.state.entities.isVisibleToTeam('dark', hero.id)).toBe(true);
  });
  it('Hamstring sweeps into the first enemy, applies bleed/slow, and leaves the rear enemy untouched', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 50, y: 50 }, team: 'light' });
    const near = a.spawn('sentinel', { position: { x: 54, y: 50 }, team: 'dark' });
    const far = a.spawn('sentinel', { position: { x: 59, y: 50 }, team: 'dark' });
    const before = far.getComponent(Health).current;
    expect(a.cast(hero.id, 'ability-3')).toBeNull();
    a.run(8);
    expect(near.getComponent(Health).max - near.getComponent(Health).current).toBe(80);
    expect(near.getComponent(StatusEffects).multiplier('moveSpeed')).toBe(0.7);
    expect(
      near.getComponent(StatusEffects).active.some((status) => status.definition.id === 'bleed'),
    ).toBe(true);
    expect(far.getComponent(Health).current).toBe(before);
    a.run(46);
    expect(near.getComponent(StatusEffects).multiplier('moveSpeed')).toBe(1);
    expect(near.getComponent(Health).max - near.getComponent(Health).current).toBeGreaterThan(80);
  });
  it('Fury consumes the charged meter once and repeat presses dash with an internal cooldown', () => {
    const a = starterArena();
    const hero = a.spawn('warrior', { position: { x: 50, y: 50 }, team: 'light' });
    a.charge(hero.id);
    expect(a.cast(hero.id, 'ability-4')).toBeNull();
    a.run();
    expect(hero.getComponent(StatusEffects).multiplier('attackSpeed')).toBe(3);
    const slot = hero.getComponent(Abilities).slot('ability-4');
    expect(slot?.charge).toBe(0);
    const firstCast = slot?.lastCast?.tick;
    expect(a.cast(hero.id, 'ability-4')).toBeNull();
    a.run(5);
    expect(hero.getComponent(Transform).position.x).toBeCloseTo(53);
    expect(slot?.lastCast?.tick).toBe(firstCast);
    expect(a.cast(hero.id, 'ability-4')).toBe('on-cooldown');
    a.run(240);
    expect(hero.getComponent(StatusEffects).multiplier('attackSpeed')).toBe(1);
  });
});
