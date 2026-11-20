import { describe, expect, it } from 'vitest';
import { Abilities } from '../../components/Abilities';
import { Health } from '../../components/Health';
import { StatusEffects } from '../../components/StatusEffects';
import { Transform } from '../../components/Transform';
import { starterArena } from '../__fixtures__/starterArena';

describe('Sentinel starter gameplay', () => {
  it('refuses growth into a wall and refuses wall placement through another body before payment', () => {
    const a = starterArena();
    const hero = a.spawn('sentinel', { position: { x: 50, y: 50 }, team: 'light' });
    a.collisions.addObstacle('existing-wall', [
      { x: 51.4, y: 45 },
      { x: 52, y: 45 },
      { x: 52, y: 55 },
      { x: 51.4, y: 55 },
    ]);
    a.charge(hero.id);
    expect(a.cast(hero.id, 'ability-4')).toBe('restricted');
    expect(hero.getComponent(Abilities).slot('ability-4')?.charge).toBe(1);
    a.collisions.removeObstacle('existing-wall');
    a.spawn('warrior', { position: { x: 52, y: 50 }, team: 'dark' });
    expect(a.cast(hero.id, 'ability-3')).toBe('restricted');
  });
  it('Rip & Tear hits the front cone, executes low-health targets and pulls survivors', () => {
    const a = starterArena();
    const hero = a.spawn('sentinel', { position: { x: 50, y: 50 }, team: 'light' });
    const front = a.spawn('warrior', { position: { x: 52, y: 50 }, team: 'dark' });
    const rear = a.spawn('warrior', { position: { x: 48, y: 50 }, team: 'dark' });
    front.addComponent(new Health(10000));
    front.getComponent(Health).applyDamage(front.getComponent(Health).max * 0.75);
    const before = front.getComponent(Health).current;
    const rearBefore = rear.getComponent(Health).current;
    expect(a.cast(hero.id, 'ability-2', { x: 60, y: 50 })).toBeNull();
    a.run();
    expect(before - front.getComponent(Health).current).toBe(180);
    expect(rear.getComponent(Health).current).toBe(rearBefore);
    expect(
      front.getComponent(StatusEffects).active.some((status) => status.definition.id === 'bleed'),
    ).toBe(true);
    a.run(10);
    expect(front.getComponent(Transform).position.x).toBeCloseTo(50.5);
  });
  it('Shield Wall has one destructible health pool and blocks walking/dashes until expiry', () => {
    const a = starterArena();
    const hero = a.spawn('sentinel', { position: { x: 50, y: 50 }, team: 'light' });
    expect(a.cast(hero.id, 'ability-3', { x: 60, y: 50 })).toBeNull();
    a.run();
    const wall = a.list().find((entity) => entity.definitionId === 'ability-shield-wall');
    expect(wall?.getComponent(Health).current).toBe(800);
    expect(a.collisions.reach({ x: 50, y: 50 }, { x: 1, y: 0 }, 10, 0.5)).toBeLessThan(2);
    a.run(180);
    expect(wall === undefined ? true : a.state.entities.has(wall.id)).toBe(false);
    expect(a.collisions.reach({ x: 50, y: 50 }, { x: 1, y: 0 }, 10, 0.5)).toBe(10);
  });
  it('destroying Shield Wall also opens collision immediately when it retires', () => {
    const a = starterArena();
    const hero = a.spawn('sentinel', { position: { x: 50, y: 50 }, team: 'light' });
    const enemy = a.spawn('warrior', { position: { x: 55, y: 50 }, team: 'dark' });
    a.cast(hero.id, 'ability-3');
    a.run();
    const wall = a.list().find((entity) => entity.definitionId === 'ability-shield-wall');
    if (wall === undefined) throw new Error('Shield Wall did not spawn');
    a.damage.apply(a.state, wall.id, 800, {
      attackerId: enemy.id,
      kind: 'ability',
      definitionId: 'test-hit',
    });
    a.run();
    expect(a.state.entities.has(wall.id)).toBe(false);
    expect(a.collisions.reach({ x: 50, y: 50 }, { x: 1, y: 0 }, 10, 0.5)).toBe(10);
  });
  it('Berserk changes actual size, outgoing damage and incoming damage, then restores size exactly', () => {
    const a = starterArena();
    const hero = a.spawn('sentinel', { position: { x: 50, y: 50 }, team: 'light' });
    const enemy = a.spawn('sentinel', { position: { x: 60, y: 50 }, team: 'dark' });
    const radius = hero.getComponent(Transform).radius;
    a.charge(hero.id);
    a.cast(hero.id, 'ability-4');
    a.run();
    expect(hero.getComponent(Transform).radius).toBeCloseTo(radius * 1.3);
    const before = enemy.getComponent(Health).current;
    a.damage.apply(a.state, enemy.id, 100, {
      attackerId: hero.id,
      kind: 'weapon',
      definitionId: 'test-weapon',
    });
    expect(before - enemy.getComponent(Health).current).toBe(150);
    const ownBefore = hero.getComponent(Health).current;
    a.damage.apply(a.state, hero.id, 100, {
      attackerId: enemy.id,
      kind: 'weapon',
      definitionId: 'test-weapon',
    });
    expect(ownBefore - hero.getComponent(Health).current).toBe(70);
    a.run(360);
    expect(hero.getComponent(Transform).radius).toBe(radius);
  });
});
