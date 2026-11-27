import { describe, expect, it } from 'vitest';

import { MapFeatureLink } from '../components/MapFeatureLink';
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

  it('links an entity placed from a map feature, whatever its family, and no other (DEC-252)', () => {
    const factory = makeFactory();

    const built = factory.create('factory-entity', 'factory-definition', {
      ...PLACEMENT,
      mapFeatureId: 'capture-point-lane-1',
    });
    const loose = factory.create('factory-entity', 'factory-definition', PLACEMENT);

    expect(built.family).toBe('test-family');
    expect(built.getComponent(MapFeatureLink).featureId).toBe('capture-point-lane-1');
    expect(loose.hasComponent(MapFeatureLink)).toBe(false);
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

  it('spawns with the loadout its resolver decides, from the placement loadout', () => {
    const registry = new EntityRegistry();
    registry.register('factory-entity', FactoryEntity);
    const weapons = new ContentCatalogue([]);
    const asked: unknown[] = [];
    const decided = { classId: 'warrior', specId: 'knight', primaryWeaponId: 'raptor-talons' };
    const factory = new EntityFactory(registry, new ContentCatalogue([DEFINITION]), undefined, {
      weapons,
      loadouts: {
        loadoutFor: (definitionId, given) => {
          asked.push([definitionId, given]);
          return decided;
        },
      },
    });
    const given = { classId: 'warrior', specId: 'knight', primaryWeaponId: 'gone' };

    const entity = factory.create('factory-entity', 'factory-definition', {
      ...PLACEMENT,
      loadout: given,
    });

    expect(asked).toEqual([['factory-definition', given]]);
    expect((entity as FactoryEntity).spawnPayload).toEqual({
      ...PLACEMENT,
      definition: DEFINITION,
      weapons,
      loadout: decided,
    });
  });

  it('forwards its weapon source in the spawn context', () => {
    const registry = new EntityRegistry();
    registry.register('factory-entity', FactoryEntity);
    const weapons = new ContentCatalogue([]);
    const factory = new EntityFactory(registry, new ContentCatalogue([DEFINITION]), undefined, {
      weapons,
    });

    const entity = factory.create('factory-entity', 'factory-definition', PLACEMENT);

    expect((entity as FactoryEntity).spawnPayload).toEqual({
      ...PLACEMENT,
      definition: DEFINITION,
      weapons,
    });
  });
});
