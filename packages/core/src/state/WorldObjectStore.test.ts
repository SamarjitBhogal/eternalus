import { describe, expect, it } from 'vitest';
import { WorldObjectStore } from './WorldObjectStore';
import { EntityStore } from './EntityStore';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import {
  MAP_OBJECT_DEFINITIONS,
  RUINED_FORT_WALL_DEFINITION,
} from '../content/maps/mapObjectDefinitions';
import { TeamMembership } from '../components/TeamMembership';
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
    const world = new WorldObjectStore({
      objects: [{ id: 'house', kind: 'house', isBlocking: true, footprints: [[{ x: 0, y: 0 }]] }],
      factory,
      entities: new EntityStore(),
      definitions,
    });
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
      isDestroyed: true,
      health: { current: 0, max: 100 },
    });
    expect(world.destroyedIds.has('house')).toBe(true);
  });

  /** A tower stand-in at (5, 5): its own object (the keep) and two fort walls, top and bottom. */
  const fortFixture = () => {
    const definitions = new Map(
      [...Object.values(MAP_OBJECT_DEFINITIONS), RUINED_FORT_WALL_DEFINITION].map((definition) => [
        definition.id,
        definition,
      ]),
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
    const tower = factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, {
      position: { x: 5, y: 5 },
    });
    entities.add(tower);
    const box = (x0: number, y0: number, x1: number, y1: number) => [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ];
    const keep: MapObject = {
      id: 'fort',
      kind: 'spawner-tower',
      isBlocking: true,
      footprints: [box(4, 4, 6, 6)],
    };
    const wall = (id: string, y0: number): MapObject => ({
      id,
      kind: 'wall',
      isBlocking: true,
      partOf: 'fort',
      footprints: [box(0, y0, 10, y0 + 1)],
    });
    const objects = [keep, wall('fort-wall-top', 0), wall('fort-wall-bottom', 9)];
    const world = new WorldObjectStore({
      objects,
      factory,
      entities,
      definitions: MAP_OBJECT_DEFINITIONS,
      owners: new Map(objects.map(({ id }) => [id, tower.id])),
      ruinWall: RUINED_FORT_WALL_DEFINITION,
    });
    /** Puts an attacker at `at`, kills the tower with its hit, and retires the tower. */
    const killFrom = (at: { x: number; y: number } | null): void => {
      const attacker =
        at === null
          ? null
          : factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, { position: at });
      if (attacker !== null) entities.add(attacker);
      tower.getComponent(Health).applyDamage(tower.getComponent(Health).current);
      world.died(tower.id, attacker?.id ?? null);
      entities.remove(tower.id, 'died');
      world.removed(tower.id);
    };
    return { world, entities, tower, killFrom };
  };

  it('makes a lane tower and its fort walls one health pool while the tower stands (DEC-185 B)', () => {
    const { world, entities, tower } = fortFixture();

    // No entity of its own for any of them: hits on the walls are hits on the tower.
    expect(entities.size).toBe(1);
    tower.getComponent(Health).applyDamage(40);
    expect(world.snapshot()).toEqual([
      { id: 'fort', entityId: tower.id, health: { current: 60, max: 100 }, isDestroyed: false },
      // A wall shows no pool of its own; the tower's object carries the one bar.
      { id: 'fort-wall-top', entityId: tower.id, health: null, isDestroyed: false },
      { id: 'fort-wall-bottom', entityId: tower.id, health: null, isDestroyed: false },
    ]);
    expect(world.objectFor(tower.id)).toBeUndefined();
    // The tower dies: until it is retired, its fort still blocks.
    tower.getComponent(Health).applyDamage(60);
    expect(world.blockingAt({ x: 5, y: 0.5 }, 0.5)).toBe('fort-wall-top');
    expect(world.blockingAt({ x: 5, y: 5 }, 0.5)).toBe('fort');
  });

  it('drops the wall that took the killing hit with the tower and leaves each other wall standing as scenery at half health (DEC-217 (12), DEC-219 (a))', () => {
    const { world, entities, tower, killFrom } = fortFixture();

    killFrom({ x: 5, y: -2 });

    const [keep, top, bottom] = world.snapshot();
    expect(keep).toEqual({ id: 'fort', entityId: null, health: null, isDestroyed: true });
    expect(top).toEqual({ id: 'fort-wall-top', entityId: null, health: null, isDestroyed: true });
    expect(bottom).toMatchObject({
      id: 'fort-wall-bottom',
      health: { current: 1000, max: 1000 },
      isDestroyed: false,
    });
    expect(world.destroyedIds).toEqual(new Set(['fort', 'fort-wall-top']));
    expect(world.fallen(tower.id).map(({ id }) => id)).toEqual(['fort', 'fort-wall-top']);
    // The ruins: the keep and the fallen wall stop blocking; the other wall blocks until it falls.
    expect(world.blockingAt({ x: 5, y: 0.5 }, 0.4)).toBeNull();
    expect(world.blockingAt({ x: 5, y: 5 }, 0.5)).toBeNull();
    expect(world.blockingAt({ x: 5, y: 9.5 }, 0.4)).toBe('fort-wall-bottom');
    // That wall is scenery with a pool of its own: either side may break it (DEC-121 (a)).
    const wall = entities.get(bottom?.entityId ?? '');
    expect(wall?.definitionId).toBe(RUINED_FORT_WALL_DEFINITION.id);
    expect(wall?.findComponent(TeamMembership)).toBeUndefined();
    expect(world.objectFor(wall?.id ?? '')?.id).toBe('fort-wall-bottom');
    // It falls on its own, like any map object.
    world.removed(wall?.id ?? '');
    expect(world.destroyedIds.has('fort-wall-bottom')).toBe(true);
  });

  it.each([
    { name: 'on the tower itself', at: { x: 5, y: 3 } },
    { name: 'by no attacker with a position', at: null },
  ])('drops no wall when the killing hit landed $name (DEC-219 (a))', ({ at }) => {
    const { world, tower, killFrom } = fortFixture();

    killFrom(at);

    expect(world.fallen(tower.id).map(({ id }) => id)).toEqual(['fort']);
    expect(
      world.snapshot().map(({ id, health, isDestroyed }) => [id, health, isDestroyed]),
    ).toEqual([
      ['fort', null, true],
      ['fort-wall-top', { current: 1000, max: 1000 }, false],
      ['fort-wall-bottom', { current: 1000, max: 1000 }, false],
    ]);
  });
});
