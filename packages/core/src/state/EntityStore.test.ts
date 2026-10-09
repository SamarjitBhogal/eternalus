import { describe, expect, it } from 'vitest';

import { Brain } from '../components/Brain';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { Team } from '../teams/teams.types';
import { Entity } from '../entities/Entity';
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

class Escort extends Entity {
  public readonly kind = 'escort';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 2, y: 3 }, 0.5));
    this.addComponent(new TeamMembership('dark'));
    this.addComponent(new Brain('follow-leader'));
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

  it('reads position, team and controller for ai/, and nothing for bare or unknown entities', () => {
    const store = storeWith('bare');
    const escort = new Escort('escort', 'escort-definition');
    escort.spawn({});
    store.add(escort);

    expect(store.positionOf('escort')).toEqual({ x: 2, y: 3 });
    expect(store.teamOf('escort')).toBe('dark');
    expect(store.controllerOf('escort')).toBe('follow-leader');
    for (const id of ['bare', 'nobody']) {
      expect(store.positionOf(id)).toBeUndefined();
      expect(store.teamOf(id)).toBeUndefined();
      expect(store.controllerOf(id)).toBeUndefined();
    }
  });
});
