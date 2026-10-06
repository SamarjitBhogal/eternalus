import { describe, expect, it } from 'vitest';

import { Entity } from './Entity';
import { EntityFactory } from './EntityFactory';
import { EntityRegistry } from './EntityRegistry';

class FactoryEntity extends Entity {
  public spawnPayload: unknown = undefined;

  public readonly kind = 'factory-entity';

  public readonly family = 'test-family';

  protected installComponents(context: unknown): void {
    this.spawnPayload = context;
  }
}

describe('EntityFactory', () => {
  it('creates and spawns a registered entity kind', () => {
    const registry = new EntityRegistry();
    registry.register('factory-entity', FactoryEntity);
    const factory = new EntityFactory(registry);

    const spawnContext = { tick: 42 };
    const entity = factory.create('factory-entity', 'factory-definition', spawnContext);

    expect(entity).toBeInstanceOf(FactoryEntity);
    expect(entity.id).toBe('entity-1');
    expect(entity.definitionId).toBe('factory-definition');
    expect((entity as FactoryEntity).spawnPayload).toEqual(spawnContext);
  });

  it('assigns unique sequential ids per factory, skipping failed lookups', () => {
    const registry = new EntityRegistry();
    registry.register('factory-entity', FactoryEntity);
    const factory = new EntityFactory(registry);

    const first = factory.create('factory-entity', 'definition', {});
    expect(() => factory.create('unknown-kind', 'definition', {})).toThrow();
    const second = factory.create('factory-entity', 'definition', {});

    expect([first.id, second.id]).toEqual(['entity-1', 'entity-2']);
    expect(new EntityFactory(registry).create('factory-entity', 'definition', {}).id).toBe(
      'entity-1',
    );
  });

  it('uses an empty registry by default', () => {
    const factory = new EntityFactory();

    expect(factory.registry.has('factory-entity')).toBe(false);
  });

  it('fails with clear errors for unknown kinds and invalid registrations', () => {
    const registry = new EntityRegistry();
    const factory = new EntityFactory(registry);

    expect(() => factory.create('unknown-kind', 'definition', {})).toThrow(
      'Unknown entity kind "unknown-kind".',
    );

    // Passes registration, then its prototype chain is cut so instances are no longer Entities.
    class TamperedEntity extends FactoryEntity {}
    registry.register('bad-kind', TamperedEntity);
    Object.setPrototypeOf(TamperedEntity.prototype, Object.prototype);

    expect(() => factory.create('bad-kind', 'definition', {})).toThrow(
      'Invalid entity registration for "bad-kind": constructor must create an Entity.',
    );
  });
});
