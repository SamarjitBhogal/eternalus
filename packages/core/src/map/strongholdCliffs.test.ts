import { describe, expect, it } from 'vitest';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { strongholdCliffs } from './strongholdCliffs';
import { mirrorPolygon } from './symmetry';

describe('strongholdCliffs', () => {
  it('joins both shield ends to mirrored mountain boundaries without closing the base interior', () => {
    const terrain = strongholdCliffs(DEFAULT_MAP_LAYOUT, 1600, 900);
    expect(terrain).toHaveLength(4);
    expect(terrain[1]?.shape).toEqual(mirrorPolygon(terrain[0]?.shape ?? [], 1600));
    expect(terrain[3]?.shape).toEqual(mirrorPolygon(terrain[2]?.shape ?? [], 1600));
    expect(Math.max(...(terrain[0]?.shape.map((p) => p.y) ?? []))).toBeCloseTo(292.5);
    expect(Math.min(...(terrain[2]?.shape.map((p) => p.y) ?? []))).toBeCloseTo(607.5);
  });
  it('adds no new cliffs for a closed circular legacy boundary', () => {
    const { frontArc, ...wallRing } = DEFAULT_MAP_LAYOUT.wallRing;
    expect(frontArc).toBeDefined();
    expect(strongholdCliffs({ ...DEFAULT_MAP_LAYOUT, wallRing }, 1600, 900)).toEqual([]);
  });
});
