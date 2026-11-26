import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MAP_OBJECT_HEALTH } from '../content/maps/mapObjectDefinitions';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { CollisionResolver } from '../physics/CollisionResolver';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import { MapGenerator } from './MapGenerator';
import { MapObjectBuilder } from './MapObjectBuilder';
import { MapPresentationBuilder } from './MapPresentationBuilder';

const MAP = new MapGenerator().generate(createDefaultGameConfig(), 1);
const OBJECTS = new MapObjectBuilder().build(MAP, new MapPresentationBuilder().build(MAP));
const GEM_RADIUS = STRUCTURE_DEFINITIONS.get('cathedral').footprintRadius;
const UNIT_RADIUS = 1;

const gemAt = () => {
  const cathedral = MAP.features.find(({ kind }) => kind === 'cathedral');
  if (cathedral === undefined) throw new Error('The map has no Cathedral');
  return cathedral.position;
};

describe('CathedralInteriorBuilder', () => {
  it('stands an unbreakable blocking plinth under the gem (DEC-346)', () => {
    const plinth = OBJECTS.find(({ id }) => id === 'cathedral-interior-gem-plinth');

    expect(plinth).toMatchObject({ kind: 'cathedral', isBlocking: true, isInterior: true });
    expect(MAP_OBJECT_HEALTH[plinth?.kind ?? 'tree']).toBeNull();
  });

  it.each([
    ['from the west', { x: -1, y: 0 }],
    ['from the east', { x: 1, y: 0 }],
    ['from the north', { x: 0, y: -1 }],
    ['from the south', { x: 0, y: 1 }],
  ])('stops a unit walking into the gem %s at its edge (DEC-346)', (_, side) => {
    const gem = gemAt();
    const resolver = new CollisionResolver(
      new StaticCollisionIndex(
        OBJECTS.filter(({ isBlocking }) => isBlocking).flatMap(({ id, footprints }) =>
          footprints.map((polygon) => ({ id, polygon })),
        ),
      ),
    );
    const start = { x: gem.x + side.x * 15, y: gem.y + side.y * 15 };

    const end = resolver.move(start, { x: -side.x * 15, y: -side.y * 15 }, UNIT_RADIUS);

    const fromGem = Math.hypot(end.x - gem.x, end.y - gem.y);
    // The plinth is a polygon inscribed in the gem's circle: the unit may come a hair closer.
    expect(fromGem).toBeGreaterThan(GEM_RADIUS * 0.99);
    expect(fromGem).toBeLessThanOrEqual(GEM_RADIUS + UNIT_RADIUS + 0.01);
  });
});
