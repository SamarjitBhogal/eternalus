import {
  MAP_OBJECT_DEFINITIONS,
  RUINED_FORT_WALL_DEFINITION,
} from '../../content/maps/mapObjectDefinitions';
import type { MapObject } from '../../content/maps/mapObjects.types';
import { EntityFactory } from '../../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityStore } from '../EntityStore';
import { WorldObjectStore } from '../WorldObjectStore';

/** A factory over every map-object definition and the ruined fort wall, as the match builds it. */
export const fixtureFactory = (): EntityFactory => {
  const definitions = new Map(
    [...Object.values(MAP_OBJECT_DEFINITIONS), RUINED_FORT_WALL_DEFINITION].map((definition) => [
      definition.id,
      definition,
    ]),
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

const box = (x0: number, y0: number, x1: number, y1: number) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

/** A tower stand-in at (5, 5): its own object (the keep) and two fort walls, top and bottom. */
export const fortFixture = () => {
  const factory = fixtureFactory();
  const entities = new EntityStore();
  const tower = factory.create('obstacle', MAP_OBJECT_DEFINITIONS.rock.id, {
    position: { x: 5, y: 5 },
  });
  entities.add(tower);
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
  });
  return { world, entities, tower, factory, objects };
};
