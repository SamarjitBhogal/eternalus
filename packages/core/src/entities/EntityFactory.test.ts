import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from '../content/ContentCatalogue';
import { IdGenerator } from '../utils/IdGenerator';
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

const DEFINITION = { id: 'factory-definition', kind: 'factory-entity', displayName: 'Factory' };
const OTHER_KIND = { id: 'other-definition', kind: 'other-kind', displayName: 'Other' };
const PLACEMENT = { position: { x: 1, y: 2 }, team: 'light' } as const;

const makeFactory = (ids?: IdGenerator): EntityFactory => {
  const registry = new EntityRegistry();
  registry.register('factory-entity', FactoryEntity);
  return new EntityFactory(registry, new ContentCatalogue([DEFINITION, OTHER_KIND]), ids);
};

describe('EntityFactory', () => {
  it('spawns a registered kind with its definition looked up by id and the placement', () => {
    const entity = makeFactory().create('factory-entity', 'factory-definition', PLACEMENT);

    expect(entity).toBeInstanceOf(FactoryEntity);
    expect(entity.id).toBe('entity-1');
    expect(entity.definitionId).toBe('factory-definition');
    expect((entity as FactoryEntity).spawnPayload).toEqual({
      ...PLACEMENT,
      definition: DEFINITION,
    });
  });

  it('assigns unique sequential ids per factory, skipping failed lookups', () => {
    const factory = makeFactory();

    const first = factory.create('factory-entity', 'factory-definition', PLACEMENT);
    expect(() => factory.create('unknown-kind', 'factory-definition', PLACEMENT)).toThrow();
    const second = factory.create('factory-entity', 'factory-definition', PLACEMENT);

    expect([first.id, second.id]).toEqual(['entity-1', 'entity-2']);
    expect(makeFactory().create('factory-entity', 'factory-definition', PLACEMENT).id).toBe(
      'entity-1',
    );
  });

  it('takes ids from the IdGenerator it is given', () => {
    const entity = makeFactory(new IdGenerator(41)).create(
      'factory-entity',
      'factory-definition',
      PLACEMENT,
    );

    expect(entity.id).toBe('entity-42');
  });

  it('says whether it can build a kind from a definition', () => {
    const factory = makeFactory();

    expect(factory.canCreate('factory-entity', 'factory-definition')).toBe(true);
    expect(factory.canCreate('unknown-kind', 'factory-definition')).toBe(false);
    expect(factory.canCreate('factory-entity', 'no-such-definition')).toBe(false);
    expect(factory.canCreate('factory-entity', 'other-definition')).toBe(false);
  });

  it('refuses a missing definition and a definition another kind builds', () => {
    const factory = makeFactory();

    expect(() => factory.create('factory-entity', 'no-such-definition', PLACEMENT)).toThrow(
      'Unknown definition "no-such-definition".',
    );
    expect(() => factory.create('factory-entity', 'other-definition', PLACEMENT)).toThrow(
      'Definition "other-definition" is built by "other-kind", not "factory-entity".',
    );
  });

  it('fails with clear errors for unknown kinds and invalid registrations', () => {
    const registry = new EntityRegistry();
    const factory = new EntityFactory(registry, new ContentCatalogue([DEFINITION]));

    expect(() => factory.create('unknown-kind', 'factory-definition', PLACEMENT)).toThrow(
      'Unknown entity kind "unknown-kind".',
    );

    // Passes registration, then its prototype chain is cut so instances are no longer Entities.
    class TamperedEntity extends FactoryEntity {}
    registry.register('factory-entity', TamperedEntity);
    Object.setPrototypeOf(TamperedEntity.prototype, Object.prototype);

    expect(() => factory.create('factory-entity', 'factory-definition', PLACEMENT)).toThrow(
      'Invalid entity registration for "factory-entity": constructor must create an Entity.',
    );
  });

  it('forwards its weapon source in the spawn context', () => {
    const registry = new EntityRegistry();
    registry.register('factory-entity', FactoryEntity);
    const weapons = new ContentCatalogue([]);
    const factory = new EntityFactory(
      registry,
      new ContentCatalogue([DEFINITION]),
      undefined,
      weapons,
    );

    const entity = factory.create('factory-entity', 'factory-definition', PLACEMENT);

    expect((entity as FactoryEntity).spawnPayload).toEqual({
      ...PLACEMENT,
      definition: DEFINITION,
      weapons,
    });
  });
});
