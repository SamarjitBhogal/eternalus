import { describe, expect, it } from 'vitest';
import { WorldObjectStore } from './WorldObjectStore';
import { EntityStore } from './EntityStore';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import type { Vec2 } from '../utils/geometry.types';
import { BLOCKING_CELL_SIZE } from './WorldObjectStore.constants';

/** A factory over every map-object definition, as the match builds it. */
const fixtureFactory = (): EntityFactory => {
  const definitions = new Map(
    Object.values(MAP_OBJECT_DEFINITIONS).map((definition) => [definition.id, definition]),
  );
  return new EntityFactory(createDefaultEntityRegistry(), {
    has: (id) => definitions.has(id),
    get: (id) => {
      const definition = definitions.get(id);
      if (definition === undefined) throw new Error('Unknown fixture');
      return definition;
    },
  });
};

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
    const world = new WorldObjectStore({
      objects: [{ id: 'house', kind: 'house', isBlocking: true, footprints: [[{ x: 0, y: 0 }]] }],
      factory,
      entities: new EntityStore(),
      definitions,
    });
    expect(world.snapshot()[0]?.health).toEqual({ current: 275, max: 275 });
  });

  it('keeps health on obstacle entities and retains destroyed state after retirement', () => {
    const factory = fixtureFactory();
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
    const world = new WorldObjectStore({
      objects: [object, { ...object, id: 'mountain', kind: 'terrain' }],
      factory,
      entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });
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
      condition: 'destroyed',
      health: { current: 0, max: 100 },
    });
  });

  it("makes a structure's own map object (a lane tower's fort) share its health, and leaves it standing with none, as a ruin, once the structure is gone (DEC-185 B, DEC-341)", () => {
    const factory = fixtureFactory();
    const entities = new EntityStore();
    const tower = factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, {
      position: { x: 5, y: 5 },
    });
    entities.add(tower);
    const fort: MapObject = {
      id: 'fort',
      kind: 'spawner-tower',
      isBlocking: true,
      footprints: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
    };
    const world = new WorldObjectStore({
      objects: [fort],
      factory,
      entities,
      definitions: MAP_OBJECT_DEFINITIONS,
      owners: new Map([['fort', tower.id]]),
    });

    // No entity of its own: the fort's record is the tower and its pool.
    expect(entities.size).toBe(1);
    tower.getComponent(Health).applyDamage(40);
    expect(world.snapshot()[0]).toEqual({
      id: 'fort',
      entityId: tower.id,
      health: { current: 60, max: 100 },
      condition: 'standing',
    });
    expect(world.objectFor(tower.id)).toBeUndefined();
    // The tower dies: until it is retired, and after, its fort still blocks.
    tower.getComponent(Health).applyDamage(60);
    expect(world.blockingAt({ x: 7, y: 2 }, 0.5)).toBe('fort');
    entities.remove(tower.id, 'died');
    world.removed(tower.id);
    // It stands as a ruin that blocks (DEC-341, HC-Q91; DEC-219 (a)).
    expect(world.snapshot()[0]).toEqual({
      id: 'fort',
      entityId: null,
      health: null,
      condition: 'ruin',
    });
    expect(world.blockingAt({ x: 7, y: 2 }, 0.5)).toBe('fort');
    expect(world.destroyedIds.has('fort')).toBe(false);
  });

  it("gives an object a structure is mounted on (a wall turret's pylon) its own entity, health and the structure's breakability, and leaves it standing with them, as a ruin, once the structure is gone (DEC-388)", () => {
    const factory = fixtureFactory();
    const entities = new EntityStore();
    const turret = factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, {
      position: { x: 5, y: 5 },
    });
    turret.getComponent(Collider).setUnbreakable(true);
    entities.add(turret);
    const pylon: MapObject = {
      id: 'pylon',
      kind: 'turret',
      isBlocking: true,
      footprints: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
    };
    const world = new WorldObjectStore({
      objects: [pylon],
      factory,
      entities,
      definitions: MAP_OBJECT_DEFINITIONS,
      mounted: new Map([['pylon', turret.id]]),
    });
    const pylonId = world.snapshot()[0]?.entityId ?? '';
    const pylonHealth = entities.get(pylonId)?.getComponent(Health);

    // Its own entity and pool; a hit on one pool leaves the other as it was.
    expect(entities.size).toBe(2);
    expect(pylonId).not.toBe(turret.id);
    turret.getComponent(Health).applyDamage(40);
    pylonHealth?.applyDamage(100);
    expect(world.snapshot()[0]).toEqual({
      id: 'pylon',
      entityId: pylonId,
      health: { current: 1900, max: 2000 },
      condition: 'standing',
      mountedHealth: { current: 60, max: 100 },
    });
    expect(world.mountOf(turret.id)).toBe(pylonId);
    expect(world.contentsOf('pylon')).toEqual([turret.id]);
    expect(entities.takesNoDamage(pylonId)).toBe(true);

    // The turret goes: the pylon stands as a ruin that blocks, with its own health.
    turret.getComponent(Health).applyDamage(60);
    entities.remove(turret.id, 'died');
    world.removed(turret.id);
    expect(world.snapshot()[0]).toEqual({
      id: 'pylon',
      entityId: pylonId,
      health: { current: 1900, max: 2000 },
      condition: 'ruin',
    });
    expect(world.contentsOf('pylon')).toEqual([]);
    expect(world.mountOf(turret.id)).toBeUndefined();
    expect(world.blockingAt({ x: 7, y: 2 }, 0.5)).toBe('pylon');

    // The pylon falls later on its own: it is destroyed and blocks no more.
    pylonHealth?.applyDamage(1900);
    entities.remove(pylonId, 'died');
    world.removed(pylonId);
    // A ruin first, then destroyed: destroyed wins (DEC-389).
    expect(world.snapshot()[0]).toMatchObject({ condition: 'destroyed' });
    expect(world.blockingAt({ x: 7, y: 2 }, 0.5)).toBeNull();
  });

  it('skips an object whose footprint box misses the circle, without testing its shape', () => {
    let reads = 0;
    const corner = (x: number, y: number): Vec2 => ({
      get x() {
        reads += 1;
        return x;
      },
      get y() {
        reads += 1;
        return y;
      },
    });
    const world = new WorldObjectStore({
      objects: [
        {
          id: 'rock',
          kind: 'terrain',
          isBlocking: true,
          footprints: [[corner(0, 0), corner(4, 0), corner(4, 4)]],
        },
      ],
      factory: fixtureFactory(),
      entities: new EntityStore(),
      definitions: MAP_OBJECT_DEFINITIONS,
    });
    expect(world.blockingAt({ x: 2.5, y: 1 }, 0.5)).toBe('rock');
    // Centre outside the box, circle across its edge: the box test counts the radius.
    expect(world.blockingAt({ x: 2, y: -0.4 }, 0.5)).toBe('rock');

    reads = 0;
    expect(world.blockingAt({ x: 50, y: 50 }, 1)).toBeNull();
    expect(reads).toBe(0);
  });

  describe('its search grid', () => {
    const square = (id: string, x: number, y: number, side: number): MapObject => ({
      id,
      kind: 'terrain',
      isBlocking: true,
      footprints: [
        [
          { x, y },
          { x: x + side, y },
          { x: x + side, y: y + side },
          { x, y: y + side },
        ],
      ],
    });
    const worldOf = (...objects: MapObject[]) =>
      new WorldObjectStore({
        objects,
        factory: fixtureFactory(),
        entities: new EntityStore(),
        definitions: MAP_OBJECT_DEFINITIONS,
      });
    const edge = BLOCKING_CELL_SIZE;

    it('returns the earliest-placed blocker, though a later one is in a cell it reads first', () => {
      // The circle crosses the line between two cells. The later object is in the first cell.
      const world = worldOf(square('earlier', edge, 0, 8), square('later', edge - 8, 0, 7.5));

      expect(world.blockingAt({ x: edge - 0.2, y: 4 }, 1)).toBe('earlier');
    });

    it('finds an object from every cell its box touches, at negative coordinates too', () => {
      const world = worldOf(square('wide', -3 * edge, -3 * edge, 6 * edge));

      expect(world.blockingAt({ x: -2.5 * edge, y: -2.5 * edge }, 0.5)).toBe('wide');
      expect(world.blockingAt({ x: 2.5 * edge, y: 2.5 * edge }, 0.5)).toBe('wide');
      expect(world.blockingAt({ x: 4 * edge, y: 0 }, 0.5)).toBeNull();
    });

    it('checks every record for a circle wider than the grid or at a broken position', () => {
      const world = worldOf(square('rock', 0, 0, 4));

      expect(world.blockingAt({ x: 2, y: 2 }, 1e9)).toBe('rock');
      expect(world.blockingAt({ x: Number.NaN, y: 2 }, 1)).toBeNull();
      expect(world.blockingAt({ x: Number.POSITIVE_INFINITY, y: 2 }, 1)).toBeNull();
      expect(world.blockingAt({ x: 2, y: 2 }, Number.POSITIVE_INFINITY)).toBe('rock');
    });

    it('indexes records again when the record count changes', () => {
      const world = worldOf(square('rock', 0, 0, 4));
      expect(world.blockingAt({ x: 2, y: 2 }, 1)).toBe('rock');
      // A path that adds a record after the first search (the map stack's spawns) is covered.
      (world as unknown as { records: unknown[] }).records.push({
        object: square('late', 3 * edge, 0, 4),
        entityId: null,
        health: null,
        bounds: { x: 3 * edge, y: 0, width: 4, height: 4 },
      });

      expect(world.blockingAt({ x: 3 * edge + 2, y: 2 }, 1)).toBe('late');
    });
  });
});
