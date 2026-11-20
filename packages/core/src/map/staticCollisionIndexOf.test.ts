import { describe, expect, it } from 'vitest';

import type { MapObject } from '../content/maps/mapObjects.types';
import type { MapDefinition } from '../content/maps/maps.types';
import { CollisionResolver } from '../physics/CollisionResolver';
import { staticCollisionIndexOf } from './staticCollisionIndexOf';

const square = (x: number, size = 1) => [
  { x, y: -50 },
  { x: x + size, y: -50 },
  { x: x + size, y: 50 },
  { x, y: 50 },
];

/** A map whose only terrain is a rift at x 30 to 31. */
const MAP: MapDefinition = {
  id: 'index-test',
  displayName: 'Test',
  width: 100,
  height: 100,
  seed: 1,
  features: [],
  lanes: [],
  terrain: [{ id: 'rift', kind: 'rift', shape: square(30) }],
};

const object = (id: string, x: number, isBlocking: boolean): MapObject => ({
  id,
  kind: 'wall',
  isBlocking,
  footprints: [square(x)],
});

/** The map's bounds. */
const BOUNDS = { x: 0, y: 0, width: MAP.width, height: MAP.height };

/** How far east from x = 0 a 0.5 m circle gets on `objects` and the map's terrain. */
const reachEast = (objects: readonly MapObject[]) =>
  new CollisionResolver(staticCollisionIndexOf(MAP, objects), BOUNDS).reach(
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    100,
    0.5,
  );

describe('staticCollisionIndexOf', () => {
  it("indexes each blocking object's footprints and the map's terrain", () => {
    expect(reachEast([])).toBeCloseTo(29.5, 5);
    expect(reachEast([object('wall', 10, true)])).toBeCloseTo(9.5, 5);
  });

  it('leaves out an object that does not block', () => {
    expect(reachEast([object('rug', 10, false)])).toBeCloseTo(29.5, 5);
  });

  it('removes a destroyed object by its id', () => {
    const index = staticCollisionIndexOf(MAP, [object('wall', 10, true)]);
    index.remove('wall');

    expect(
      new CollisionResolver(index, BOUNDS).reach({ x: 0, y: 0 }, { x: 1, y: 0 }, 100, 0.5),
    ).toBeCloseTo(29.5, 4);
  });
});
