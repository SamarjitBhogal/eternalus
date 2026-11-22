import { describe, expect, it } from 'vitest';

import { Abilities } from '../components/Abilities';
import { Collider } from '../components/Collider';
import { Combat } from '../components/Combat';
import { Deploying } from '../components/Deploying';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { Team } from '../teams/teams.types';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { Legend } from '../entities/Legend';
import { Unit } from '../entities/Unit';
import { EntityStore } from './EntityStore';

class Dummy extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'test';
  public retiredWith: string | null = null;

  protected installComponents(): void {
    // A dummy has no components.
  }

  protected override onRetire(cause: string): void {
    this.retiredWith = cause;
  }
}

class Walker extends Entity {
  public readonly kind = 'walker';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Movement({ maxSpeed: 1, acceleration: 1, mass: 1 }));
  }
}

class Grunt extends Unit {
  public readonly kind = 'grunt';

  protected override installComponents(team: unknown): void {
    this.addComponent(new TeamMembership(team as Team));
  }
}

class Hero extends Legend {
  public readonly kind = 'hero';

  protected override installComponents(team: unknown): void {
    this.addComponent(new TeamMembership(team as Team));
  }
}

const storeWith = (...ids: string[]): EntityStore => {
  const store = new EntityStore();
  for (const id of ids) {
    store.add(new Dummy(id, 'dummy-definition'));
  }
  return store;
};

const idsOf = (store: EntityStore): string[] => {
  const ids: string[] = [];
  store.forEach((entity) => ids.push(entity.id));
  return ids;
};

describe('EntityStore', () => {
  it('finds added entities by id', () => {
    const store = storeWith('entity-1', 'entity-2');
    expect(store.size).toBe(2);
    expect(store.has('entity-2')).toBe(true);
    expect(store.get('entity-1')?.id).toBe('entity-1');
    expect(store.get('entity-9')).toBeUndefined();
  });

  it('rejects a duplicate id', () => {
    const store = storeWith('entity-1');
    expect(() => {
      store.add(new Dummy('entity-1', 'dummy-definition'));
    }).toThrow('already');
  });

  it('visits entities in insertion order, whatever their ids', () => {
    expect(idsOf(storeWith('entity-10', 'entity-2', 'entity-1'))).toEqual([
      'entity-10',
      'entity-2',
      'entity-1',
    ]);
  });

  it('retires a removed entity with its cause and forgets it', () => {
    const store = storeWith('entity-1', 'entity-2');
    const removed = store.remove('entity-1', 'dev-removed') as Dummy;
    expect(removed.retiredWith).toBe('dev-removed');
    expect(store.has('entity-1')).toBe(false);
    expect(idsOf(store)).toEqual(['entity-2']);
  });

  it('reports an entity as deploying only while it has the Deploying component', () => {
    const store = storeWith('entity-1');
    const entity = store.get('entity-1');
    expect(store.isDeploying('entity-1')).toBe(false);

    entity?.addComponent(new Deploying({ x: 5, y: 5 }));
    expect(store.isDeploying('entity-1')).toBe(true);

    entity?.removeComponent(Deploying);
    expect(store.isDeploying('entity-1')).toBe(false);
    expect(store.isDeploying('entity-9')).toBe(false);
  });

  it('refuses to remove an unknown id', () => {
    expect(() => new EntityStore().remove('entity-1', 'died')).toThrow('unknown entity');
  });

  it('skips entities removed during a walk', () => {
    const store = storeWith('entity-1', 'entity-2', 'entity-3');
    const visited: string[] = [];
    store.forEach((entity) => {
      visited.push(entity.id);
      if (entity.id === 'entity-1') {
        store.remove('entity-2', 'despawned');
      }
    });
    expect(visited).toEqual(['entity-1', 'entity-3']);
  });

  it('counts live entities of a family on a team', () => {
    const store = storeWith('entity-1');
    const members: [Entity, Team][] = [
      [new Grunt('entity-2', 'grunt'), 'light'],
      [new Grunt('entity-3', 'grunt'), 'dark'],
      [new Hero('entity-4', 'hero'), 'light'],
    ];
    for (const [entity, team] of members) {
      entity.spawn(team);
      store.add(entity);
    }
    expect(store.countOnTeam('light', Unit)).toBe(2);
    expect(store.countOnTeam('light', Legend)).toBe(1);
    expect(store.countOnTeam('dark', Unit)).toBe(1);
    expect(store.countOnTeam('dark', Legend)).toBe(0);
    expect(store.countOnTeam('neutral', Entity)).toBe(0);
  });

  it("records this tick's removals until they are cleared", () => {
    const store = storeWith('a', 'b');
    store.remove('a', 'died');
    store.remove('b', 'dev-removed');

    expect(store.removedThisTick()).toEqual([
      { entityId: 'a', cause: 'died' },
      { entityId: 'b', cause: 'dev-removed' },
    ]);
    store.beginTick();
    expect(store.removedThisTick()).toEqual([]);
  });

  it('steers an entity that has Movement and refuses one that does not', () => {
    const store = storeWith('still');
    const walker = new Walker('walker', 'walker-definition');
    walker.spawn({});
    store.add(walker);

    expect(store.steer('walker', { x: 0, y: 2 })).toBe(true);
    expect(walker.getComponent(Movement).heading).toEqual({ x: 0, y: 1 });
    expect(store.steer('still', { x: 1, y: 0 })).toBe(false);
    expect(store.steer('nobody', { x: 1, y: 0 })).toBe(false);
  });

  it("reads an entity's place and velocity, and nothing for an entity without them", () => {
    const store = storeWith('still');
    const minion = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30)).create(
      'light-mob',
      'light-minion',
      { team: 'dark', position: { x: 4, y: 5 } },
    );
    store.add(minion);
    const movement = minion.getComponent(Movement);
    movement.steer({ x: 1, y: 0 });
    movement.advance();

    expect(store.placeOf(minion.id)).toMatchObject({
      position: { x: 4, y: 5 },
      radius: minion.getComponent(Transform).radius,
    });
    expect(store.velocityOf(minion.id)).toEqual(movement.velocity);
    expect(store.velocityOf(minion.id)?.x).toBeGreaterThan(0);
    expect(store.placeOf('still')).toBeUndefined();
    expect(store.velocityOf('still')).toBeUndefined();
    expect(store.placeOf('nobody')).toBeUndefined();
    expect(store.velocityOf('nobody')).toBeUndefined();
  });

  it("reads an entity's team and whether it is alive", () => {
    const store = storeWith('dummy');
    const minion = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30)).create(
      'light-mob',
      'light-minion',
      { team: 'dark', position: { x: 0, y: 0 } },
    );
    store.add(minion);

    expect(store.teamOf(minion.id)).toBe('dark');
    expect(store.isAlive(minion.id)).toBe(true);
    minion.getComponent(Health).applyDamage(1e6);
    expect(store.isAlive(minion.id)).toBe(false);
    expect(store.teamOf('dummy')).toBeUndefined();
    expect(store.isAlive('dummy')).toBe(false);
    expect(store.isAlive('nobody')).toBe(false);
  });

  it("reads, sets and clears an entity's attack target", () => {
    const store = storeWith('dummy');
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const attacker = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 0, y: 0 },
    });
    store.add(attacker);

    expect(store.attackTargetOf(attacker.id)).toBeNull();
    store.setAttackTarget(attacker.id, 'dummy');
    expect(store.attackTargetOf(attacker.id)).toBe('dummy');
    store.clearAttackTarget(attacker.id);
    expect(store.attackTargetOf(attacker.id)).toBeNull();
    store.clearAttackTarget('dummy');
    expect(store.attackTargetOf('dummy')).toBeNull();
    expect(store.attackTargetOf('nobody')).toBeNull();
  });

  it('reads whom an entity attacks: its lock first, then each living body its last attack hit while the hits count, once each (DEC-322 (2))', () => {
    const store = new EntityStore();
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const spawn = (team: Team) => {
      const entity = factory.create('light-mob', 'light-minion', {
        team,
        position: { x: 0, y: 0 },
      });
      store.add(entity);
      return entity;
    };
    const attacker = spawn('dark');
    const [first, second, locked] = [spawn('light'), spawn('light'), spawn('light')];
    const combat = attacker.getComponent(Combat);

    expect(store.victimsOf(attacker.id, 0)).toEqual([]);
    combat.recordHits([first.id, second.id], 0, 1);
    expect(store.victimsOf(attacker.id, 0)).toEqual([first.id, second.id]);
    expect(store.isAttacking(attacker.id, second.id, combat.attack.interval)).toBe(true);
    expect(store.isAttacking(attacker.id, second.id, combat.attack.interval + 1)).toBe(false);

    // A locked sweep hits more than its lock; each body it hit is attacked too.
    store.setAttackTarget(attacker.id, locked.id);
    expect(store.victimsOf(attacker.id, 0)).toEqual([locked.id, first.id, second.id]);
    expect(store.isAttacking(attacker.id, first.id, 0)).toBe(true);
    store.setAttackTarget(attacker.id, first.id);
    expect(store.victimsOf(attacker.id, 0)).toEqual([first.id, second.id]);
    store.clearAttackTarget(attacker.id);

    first.getComponent(Health).applyDamage(first.getComponent(Health).current);
    expect(store.victimsOf(attacker.id, 0)).toEqual([second.id]);
    expect(store.victimsOf(first.id, 0)).toEqual([]);
    expect(store.victimsOf('nobody', 0)).toEqual([]);
    expect(store.isAttacking('nobody', first.id, 0)).toBe(false);
  });

  it('records the bodies an attack hit on the living attacker, for one attack interval or its slowed cooldown when longer (DEC-322 (2), DEC-333 (1))', () => {
    const store = new EntityStore();
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const statuses = loadStatusEffects(30, 2);
    const spawn = () => {
      const entity = factory.create('light-mob', 'light-minion', {
        team: 'dark',
        position: { x: 0, y: 0 },
      });
      store.add(entity);
      return entity;
    };
    const [attacker, slowed, hasted, dead] = [spawn(), spawn(), spawn(), spawn()];
    slowed.getComponent(StatusEffects).apply(statuses.get('concussion'), null, 0);
    hasted.getComponent(StatusEffects).apply(statuses.get('fury'), null, 0);
    dead.getComponent(Health).applyDamage(dead.getComponent(Health).current);
    const { interval } = attacker.getComponent(Combat).attack;

    for (const entity of [attacker, slowed, hasted, dead]) store.recordHits(entity.id, ['a'], 1);
    store.recordHits(attacker.id, ['b'], 1);
    store.recordHits('nobody', ['a'], 1);

    expect(store.attackSpeedOf(attacker.id)).toBe(1);
    expect(store.attackSpeedOf(slowed.id)).toBe(0.7);
    expect(store.attackSpeedOf('nobody')).toBe(1);
    expect(attacker.getComponent(Combat).hitsAt(1)).toEqual(['a', 'b']);
    expect(attacker.getComponent(Combat).hitsUntilTick).toBe(1 + interval);
    expect(slowed.getComponent(Combat).hitsUntilTick).toBe(1 + Math.round(interval / 0.7));
    // Fury triples the attack speed; its hits still count for one full interval.
    expect(hasted.getComponent(Combat).hitsUntilTick).toBe(1 + interval);
    expect(dead.getComponent(Combat).hitIds).toEqual([]);
  });

  it('reads whether an entity takes no damage now: only while its collider is unbreakable', () => {
    const store = storeWith('no-collider');
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const gate = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 0, y: 0 },
    });
    store.add(gate);

    expect(store.takesNoDamage(gate.id)).toBe(false);
    gate.getComponent(Collider).setUnbreakable(true);
    expect(store.takesNoDamage(gate.id)).toBe(true);
    expect(store.takesNoDamage('no-collider')).toBe(false);
    expect(store.takesNoDamage('nobody')).toBe(false);
  });

  it('queues a cast on an ability slot, and refuses an entity without that slot', () => {
    const store = storeWith('dummy');
    const legend = new Dummy('legend-1', 'dummy-definition');
    const bar = new Abilities({
      abilities: ['slam', 'rip-and-tear', 'shield-wall'],
      ultimate: 'berserk',
    });
    legend.addComponent(bar);
    store.add(legend);
    const aim = { point: { x: 1, y: 2 }, targetId: null };

    expect(store.queueCast('legend-1', 'ability-2', aim)).toBe(true);
    expect(bar.slot('ability-2')?.pendingCast).toBe(aim);
    expect(store.queueCast('dummy', 'ability-2', aim)).toBe(false);
    expect(store.queueCast('nobody', 'ability-2', aim)).toBe(false);
  });

  it('reads health as a fraction', () => {
    const store = storeWith('dummy');
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 0, y: 0 },
    });
    store.add(minion);
    const health = minion.getComponent(Health);
    health.applyDamage(health.max / 4);

    expect(store.healthFractionOf(minion.id)).toBe(0.75);
    expect(store.healthFractionOf('dummy')).toBeUndefined();
  });
});
