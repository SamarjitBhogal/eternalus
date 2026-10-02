import { describe, expect, it } from 'vitest';

import { Entity } from './Entity.js';
import { EntityFactory } from './EntityFactory.js';
import { EntityRegistry } from './EntityRegistry.js';

class FactoryEntity extends Entity {
  constructor(id, definitionId) {
    super(id, definitionId);
    this.spawnPayload = undefined;
  }

  get kind() {
    return 'factory-entity';
  }

  get family() {
    return 'test-family';
  }

  installComponents(context) {
    this.spawnPayload = context;
  }
}

describe('EntityFactory', () => {
  it('creates and spawns a registered entity kind', () => {
    const registry = new EntityRegistry();
    registry.register('factory-entity', FactoryEntity);
    const factory = new EntityFactory(registry);

    const spawnContext = { tick: 42 };
    const entity = factory.create('factory-entity', 'entity-1', 'factory-definition', spawnContext);

    expect(entity).toBeInstanceOf(FactoryEntity);
    expect(entity.id).toBe('entity-1');
    expect(entity.definitionId).toBe('factory-definition');
    expect(entity.spawnPayload).toEqual(spawnContext);
  });

  it('fails with clear errors for unknown kinds and invalid registrations', () => {
    const registry = new EntityRegistry();
    const factory = new EntityFactory(registry);

    expect(() => factory.create('unknown-kind', 'entity-2', 'definition', {})).toThrow(
      'Unknown entity kind "unknown-kind".',
    );
    registry._constructors.set('bad-kind', class BadEntity {});
    expect(() => factory.create('bad-kind', 'entity-3', 'definition', {})).toThrow(
      'Invalid entity registration for "bad-kind": constructor must create an Entity.',
    );
  });
});
