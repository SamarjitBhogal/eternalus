import { describe, expect, it } from 'vitest';

import type { PlacedWalls } from '../state/PlacedWalls.types';
import type { Polygon } from '../utils/geometry.types';
import { summonPosition, summonPreview } from './summonPlacement';

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

describe('summonPreview', () => {
  it('places the outline the distance ahead, turned to the direction, and asks the walls about it', () => {
    const { walls, asked } = wallAt(100);

    const east = summonPreview(walls, CORNERS, { x: 10, y: 20 }, EAST, 3);
    const north = summonPreview(walls, CORNERS, { x: 10, y: 20 }, { x: 0, y: 1 }, 3);

    expect(east).toEqual({
      outline: [
        { x: 12.5, y: 18 },
        { x: 13.5, y: 18 },
        { x: 13.5, y: 22 },
        { x: 12.5, y: 22 },
      ],
      isBlocked: false,
    });
    expect(north?.outline).toEqual([
      { x: 12, y: 22.5 },
      { x: 12, y: 23.5 },
      { x: 8, y: 23.5 },
      { x: 8, y: 22.5 },
    ]);
    expect(asked).toEqual([east?.outline, north?.outline]);
  });

  it('is blocked where the walls call the outline blocked, and free where they do not', () => {
    expect(summonPreview(wallAt(13).walls, CORNERS, { x: 10, y: 20 }, EAST, 3)?.isBlocked).toBe(
      true,
    );
    expect(summonPreview(wallAt(14).walls, CORNERS, { x: 10, y: 20 }, EAST, 3)?.isBlocked).toBe(
      false,
    );
  });

  it('places the outline but never blocks it with no walls (no map objects)', () => {
    expect(summonPreview(null, CORNERS, { x: 10, y: 20 }, EAST, 3)).toEqual({
      outline: [
        { x: 12.5, y: 18 },
        { x: 13.5, y: 18 },
        { x: 13.5, y: 22 },
        { x: 12.5, y: 22 },
      ],
      isBlocked: false,
    });
  });

  it('is null with the zero direction, and does not ask the walls', () => {
    const { walls, asked } = wallAt(0);

    expect(summonPreview(walls, CORNERS, { x: 10, y: 20 }, { x: 0, y: 0 }, 3)).toBeNull();
    expect(asked).toEqual([]);
  });
});
