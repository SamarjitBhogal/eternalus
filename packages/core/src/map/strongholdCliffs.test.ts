import { describe, expect, it } from 'vitest';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { strongholdCliffs } from './strongholdCliffs';
import { mirrorPolygon } from './symmetry';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { distance } from '../utils/geometry';

describe('strongholdCliffs', () => {
  it('joins both shield ends to mirrored mountain boundaries without closing the base interior', () => {
    const terrain = strongholdCliffs(DEFAULT_MAP_LAYOUT, 1600, 900);
    expect(terrain).toHaveLength(4);
    expect(terrain[1]?.shape).toEqual(mirrorPolygon(terrain[0]?.shape ?? [], 1600));
    expect(terrain[3]?.shape).toEqual(mirrorPolygon(terrain[2]?.shape ?? [], 1600));
    expect(Math.max(...(terrain[0]?.shape.map((p) => p.y) ?? []))).toBeCloseTo(292.5);
    expect(Math.min(...(terrain[2]?.shape.map((p) => p.y) ?? []))).toBeCloseTo(607.5);
  });
  it('meets every shield tip at its cliff corner, so the open rear stays sealed (DEC-158)', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    for (const [team, edge] of [
      ['light', 'west'],
      ['dark', 'east'],
    ] as const) {
      const wall = map.features
        .filter((f) => f.team === team && f.kind === 'wall-segment')
        .flatMap((f) => f.footprint ?? []);
      for (const side of ['north', 'south']) {
        const cliff = map.terrain.find((t) => t.id === `${edge}-stronghold-cliff-${side}`);
        const gap = Math.min(
          ...(cliff?.shape ?? []).flatMap((corner) => wall.map((v) => distance(v, corner))),
        );
        expect(gap).toBeLessThan(1e-6);
      }
    }
  });
});
