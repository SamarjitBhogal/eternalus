import { describe, expect, it } from 'vitest';

import { Entity } from '../entities/Entity';
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
});
