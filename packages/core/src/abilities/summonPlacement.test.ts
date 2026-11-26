import { describe, expect, it } from 'vitest';

import type { PlacedWalls } from '../state/PlacedWalls.types';
import type { Polygon } from '../utils/geometry.types';
import { isSummonBlocked, summonPosition } from './summonPlacement';

/** A 1 m by 4 m outline, +x along its facing (the Shield Wall barrier's shape). */
const CORNERS: Polygon = [
  { x: -0.5, y: -2 },
  { x: 0.5, y: -2 },
  { x: 0.5, y: 2 },
  { x: -0.5, y: 2 },
];
const EAST = { x: 1, y: 0 };

/**
 * Walls that record each outline asked about and call it blocked when any corner is east of
 * `wallX`. The rule itself (walls and the map's edge) is `RuntimeWalls.isBlocked`'s, tested in
 * `map/RuntimeWalls.test.ts`.
 */
const wallAt = (wallX: number) => {
  const asked: Polygon[] = [];
  const walls: PlacedWalls = {
    isBlocked: (outline) => {
      asked.push(outline);
      return outline.some(({ x }) => x > wallX);
    },
    add: () => undefined,
    remove: () => undefined,
  };
  return { walls, asked };
};

describe('summonPosition', () => {
  it('is the distance from the start along the direction', () => {
    expect(summonPosition({ x: 10, y: 20 }, { x: 0, y: -1 }, 3)).toEqual({ x: 10, y: 17 });
  });
});

describe('isSummonBlocked', () => {
  it('asks the walls about the outline placed the distance ahead, turned to the direction', () => {
    const { walls, asked } = wallAt(100);

    expect(isSummonBlocked(walls, CORNERS, { x: 10, y: 20 }, EAST, 3)).toBe(false);
    expect(asked).toEqual([
      [
        { x: 12.5, y: 18 },
        { x: 13.5, y: 18 },
        { x: 13.5, y: 22 },
        { x: 12.5, y: 22 },
      ],
    ]);
  });

  it('is blocked where the walls call the outline blocked', () => {
    expect(isSummonBlocked(wallAt(13).walls, CORNERS, { x: 10, y: 20 }, EAST, 3)).toBe(true);
  });

  it('is never blocked with no walls (no map objects), or with no direction', () => {
    const { walls, asked } = wallAt(0);

    expect(isSummonBlocked(null, CORNERS, { x: 10, y: 20 }, EAST, 3)).toBe(false);
    expect(isSummonBlocked(walls, CORNERS, { x: 10, y: 20 }, { x: 0, y: 0 }, 3)).toBe(false);
    expect(asked).toEqual([]);
  });
});
