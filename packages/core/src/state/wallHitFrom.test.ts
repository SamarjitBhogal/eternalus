import { describe, expect, it } from 'vitest';

import type { MapObject } from '../content/maps/mapObjects.types';
import { wallHitFrom } from './wallHitFrom';

const box = (id: string, x0: number, y0: number, x1: number, y1: number, partOf?: string) => {
  const object: MapObject = {
    id,
    kind: partOf === undefined ? 'spawner-tower' : 'wall',
    isBlocking: true,
    ...(partOf === undefined ? {} : { partOf }),
    footprints: [
      [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ],
    ],
  };
  return object;
};

// A keep in the middle of a 20 x 20 fort, a wall on the west and one on the east.
const keep = box('fort', 8, 8, 12, 12);
const west = box('fort-wall-west', 0, 0, 1, 20, 'fort');
const east = box('fort-wall-east', 19, 0, 20, 20, 'fort');

describe('wallHitFrom', () => {
  it('returns the wall nearer the attacker', () => {
    expect(wallHitFrom([keep, west, east], { x: -5, y: 10 }, { x: 0, y: 0 })).toBe(west);
    expect(wallHitFrom([keep, west, east], { x: 25, y: 10 }, { x: 0, y: 0 })).toBe(east);
  });

  it('gives a tie between two walls to the lower index', () => {
    const from = { x: 10, y: -5 };

    expect(wallHitFrom([keep, west, east], from, { x: 0, y: 0 })).toBe(west);
    expect(wallHitFrom([keep, east, west], from, { x: 0, y: 0 })).toBe(east);
  });

  it('returns nothing when the keep is nearer than every wall', () => {
    expect(wallHitFrom([keep, west, east], { x: 10, y: 10 }, { x: 0, y: 0 })).toBeUndefined();
  });

  it('gives a tie between a wall and the keep to the wall', () => {
    const near = box('fort-wall-north', 0, 8, 20, 9, 'fort');

    expect(wallHitFrom([keep, near], { x: 10, y: -5 }, { x: 0, y: 0 })).toBe(near);
  });

  it('returns nothing for a body with no walls, or an empty body', () => {
    expect(wallHitFrom([keep], { x: -5, y: 10 }, { x: 0, y: 0 })).toBeUndefined();
    expect(wallHitFrom([], { x: -5, y: 10 }, { x: 0, y: 0 })).toBeUndefined();
  });
});
