import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { TeamMembership } from '../components/TeamMembership';
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

  it('reads health as a fraction and whether a target is in attack reach', () => {
    const store = storeWith('dummy');
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const minion = factory.create('light-mob', 'light-minion', {
      team: 'dark',
      position: { x: 0, y: 0 },
    });
    const near = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 2, y: 0 },
    });
    const far = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 5, y: 0 },
    });
    store.add(minion);
    store.add(near);
    store.add(far);
    const health = minion.getComponent(Health);
    health.applyDamage(health.max / 4);

    expect(store.healthFractionOf(minion.id)).toBe(0.75);
    expect(store.healthFractionOf('dummy')).toBeUndefined();
    // Edge to edge: 2 − 0.4 − 0.4 = 1.2 m, inside the 1.5 m reach; 4.2 m is not.
    expect(store.isInReach(minion.id, near.id)).toBe(true);
    expect(store.isInReach(minion.id, far.id)).toBe(false);
    expect(store.isInReach('dummy', near.id)).toBe(false);
    expect(store.isInReach(minion.id, 'nobody')).toBe(false);
  });
});
