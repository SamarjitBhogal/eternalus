import { describe, expect, it } from 'vitest';
import { Health } from '../../components/Health';
import { Transform } from '../../components/Transform';
import { Channeling } from '../../components/Channeling';
import { starterArena } from '../__fixtures__/starterArena';

describe('Magus starter gameplay', () => {
  it('Imbue enhances weapon damage without also multiplying spell damage', () => {
    const a = starterArena();
    const hero = a.spawn('magus', { position: { x: 50, y: 50 }, team: 'light' });
    const enemy = a.spawn('sentinel', { position: { x: 60, y: 50 }, team: 'dark' });
    expect(a.cast(hero.id, 'ability-3')).toBeNull();
    a.run();
    const before = enemy.getComponent(Health).current;
    a.damage.apply(a.state, enemy.id, 100, {
      attackerId: hero.id,
      kind: 'weapon',
      definitionId: 'staff',
    });
    expect(before - enemy.getComponent(Health).current).toBe(125);
    const after = enemy.getComponent(Health).current;
    a.damage.apply(a.state, enemy.id, 100, {
      attackerId: hero.id,
      kind: 'ability',
      definitionId: 'shockwave',
    });
    expect(after - enemy.getComponent(Health).current).toBe(100);
  });
  it('Sanctuary is stationary, heals only allies inside, and lasts its authored five seconds', () => {
    const a = starterArena();
    const hero = a.spawn('magus', { position: { x: 50, y: 50 }, team: 'light' });
    const ally = a.spawn('sentinel', { position: { x: 51, y: 50 }, team: 'light' });
    const enemy = a.spawn('sentinel', { position: { x: 51, y: 51 }, team: 'dark' });
    ally.getComponent(Health).applyDamage(500);
    enemy.getComponent(Health).applyDamage(500);
    const before = ally.getComponent(Health).current;
    const enemyBefore = enemy.getComponent(Health).current;
    expect(a.cast(hero.id, 'ability-2')).toBeNull();
    a.run(30);
    expect(ally.getComponent(Health).current - before).toBeCloseTo(
      ally.getComponent(Health).max * 0.04,
    );
    expect(enemy.getComponent(Health).current).toBe(enemyBefore);
    hero.getComponent(Transform).moveTo({ x: 70, y: 50 });
    a.run(120);
    expect(a.list().filter((entity) => entity.definitionId === 'sanctuary-field')).toHaveLength(1);
    a.run();
    expect(a.list().filter((entity) => entity.definitionId === 'sanctuary-field')).toHaveLength(0);
    const healed = ally.getComponent(Health).current;
    a.run(30);
    expect(ally.getComponent(Health).current).toBe(healed);
  });
  it('Death Ray delivers eight pulses over four seconds and releases its channel', () => {
    const a = starterArena();
    const hero = a.spawn('magus', { position: { x: 20, y: 50 }, team: 'light' });
    const enemy = a.spawn('sentinel', { position: { x: 40, y: 50 }, team: 'dark' });
    enemy.addComponent(new Health(10000));
    a.charge(hero.id);
    expect(a.cast(hero.id, 'ability-4', { x: 70, y: 50 })).toBeNull();
    a.run(121);
    expect(enemy.getComponent(Health).current).toBe(8800);
    expect(hero.hasComponent(Channeling)).toBe(false);
    expect(a.list().filter((entity) => entity.definitionId === 'death-ray-field')).toHaveLength(0);
  });
  it('opposing rays extend symmetrically but stop by eight seconds, and stun interrupts', () => {
    const a = starterArena();
    const left = a.spawn('magus', { position: { x: 30, y: 50 }, team: 'light' });
    const right = a.spawn('magus', { position: { x: 50, y: 50 }, team: 'dark' });
    left.addComponent(new Health(10000));
    right.addComponent(new Health(10000));
    a.charge(left.id);
    a.charge(right.id);
    a.cast(left.id, 'ability-4', { x: 60, y: 50 });
    a.cast(right.id, 'ability-4', { x: 20, y: 50 });
    a.run(121);
    expect(left.hasComponent(Channeling)).toBe(true);
    expect(right.hasComponent(Channeling)).toBe(true);
    expect(left.getComponent(Health).current).toBe(right.getComponent(Health).current);
    a.run(120);
    expect(left.hasComponent(Channeling)).toBe(false);
    expect(right.hasComponent(Channeling)).toBe(false);
    const b = starterArena();
    const caster = b.spawn('magus', { position: { x: 30, y: 50 }, team: 'light' });
    b.charge(caster.id);
    b.cast(caster.id, 'ability-4');
    b.run();
    b.statuses.apply(b.state, caster.id, 'stun', null);
    b.run();
    expect(caster.hasComponent(Channeling)).toBe(false);
  });
});
