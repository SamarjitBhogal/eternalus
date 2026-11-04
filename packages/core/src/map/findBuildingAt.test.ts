import { describe, expect, it } from 'vitest';

import type { MapBuilding } from '../content/maps/maps.types';
import type { Polygon } from '../utils/geometry.types';
import { findBuildingAt } from './findBuildingAt';

/** An axis-aligned square polygon from (x, y) with side `size`. */
const square = (x: number, y: number, size: number): Polygon => [
  { x, y },
  { x: x + size, y },
  { x: x + size, y: y + size },
  { x, y: y + size },
];

describe('findBuildingAt', () => {
  const hall: MapBuilding = { id: 'hall', footprint: [square(0, 0, 4), square(10, 0, 2)] };
  const chapel: MapBuilding = { id: 'chapel', footprint: [square(20, 20, 4)] };

  it('finds the building whose footprint holds the point, in any of its polygons', () => {
    expect(findBuildingAt([hall, chapel], { x: 2, y: 2 })).toBe(hall);
    expect(findBuildingAt([hall, chapel], { x: 11, y: 1 })).toBe(hall);
    expect(findBuildingAt([hall, chapel], { x: 22, y: 22 })).toBe(chapel);
  });

  it('finds no building for a point on open ground', () => {
    expect(findBuildingAt([hall, chapel], { x: 7, y: 2 })).toBeUndefined();
    expect(findBuildingAt([], { x: 2, y: 2 })).toBeUndefined();
  });

  it('picks the first building when two footprints hold the point', () => {
    const annex: MapBuilding = { id: 'annex', footprint: [square(1, 1, 2)] };

    expect(findBuildingAt([hall, annex], { x: 2, y: 2 })).toBe(hall);
    expect(findBuildingAt([annex, hall], { x: 2, y: 2 })).toBe(annex);
  });
});
