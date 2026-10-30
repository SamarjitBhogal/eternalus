import { describe, expect, it } from 'vitest';
import { WorldObjectStore } from './WorldObjectStore';
import { EntityStore } from './EntityStore';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { Health } from '../components/Health';

describe('WorldObjectStore', () => {
  it('uses injected content policy instead of global map-object defaults', () => {
    const definitions = {
      ...MAP_OBJECT_DEFINITIONS,
      house: { ...MAP_OBJECT_DEFINITIONS.house, id: 'fixture-house', health: 275 },
    };
    const byId = new Map(
      Object.values(definitions).map((definition) => [definition.id, definition]),
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), {
      has: (id) => byId.has(id),
      get: (id) => {
        const definition = byId.get(id);
        if (definition === undefined) throw new Error('Unknown injected definition');
        return definition;
      },
    });
    const world = new WorldObjectStore(
      [{ id: 'house', kind: 'house', isBlocking: true, footprints: [[{ x: 0, y: 0 }]] }],
      factory,
      new EntityStore(),
      definitions,
    );
    expect(world.snapshot()[0]?.health).toEqual({ current: 275, max: 275 });
  });

  it('keeps health on obstacle entities and retains destroyed state after retirement', () => {
    const definitions = new Map(
      Object.values(MAP_OBJECT_DEFINITIONS).map((definition) => [definition.id, definition]),
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), {
      has: (id) => definitions.has(id),
      get: (id) => {
        const definition = definitions.get(id);
        if (definition === undefined) throw new Error('Unknown fixture');
        return definition;
      },
    });
    const entities = new EntityStore();
    const object: MapObject = {
      id: 'house',
      kind: 'house',
      isBlocking: true,
      buildingId: 'palace',
      footprints: [
        [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 },
        ],
      ],
    };
    const world = new WorldObjectStore(
      [object, { ...object, id: 'mountain', kind: 'terrain' }],
      factory,
      entities,
      MAP_OBJECT_DEFINITIONS,
    );
    const house = world.snapshot()[0];
    expect(house?.health).toEqual({ current: 100, max: 100 });
    expect(world.snapshot()[1]?.health).toBeNull();
    expect(entities.size).toBe(1);
    const entity = entities.get(house?.entityId ?? '');
    if (entity === undefined) throw new Error('No house');
    expect(world.contentsOf('palace')).toEqual([entity.id]);
    expect(world.objectFor(entity.id)).toBe(object);
    entity.getComponent(Health).applyDamage(100);
    entities.remove(entity.id, 'died');
    world.removed(entity.id);
    world.removed('unknown');
    expect(world.snapshot()[0]).toMatchObject({
      isDestroyed: true,
      health: { current: 0, max: 100 },
    });
    expect(world.destroyedIds.has('house')).toBe(true);
  });
});
