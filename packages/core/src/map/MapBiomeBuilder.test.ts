import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { MapSceneryBuilder } from './MapSceneryBuilder';
import { MapBiomeVegetationBuilder } from './MapBiomeVegetationBuilder';
import { sceneryBiomeAt } from './sceneryBiome';

describe('biome scenery', () => {
  it('extends both regions to their mountains with distinct terrain, vegetation and explicit animation metadata', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const before = structuredClone(map);
    const art = new MapSceneryBuilder(map).build();
    for (const kind of ['snow', 'lava'] as const) {
      const region = art.find((piece) => piece.ambientBiome === kind);
      expect(region).toBeDefined();
      expect(region?.shape.some((point) => point.y === (kind === 'snow' ? 0 : map.height))).toBe(
        true,
      );
      expect(art.some((piece) => piece.id.startsWith(`${kind}-terrace-`))).toBe(true);
    }
    expect(art.some((piece) => piece.id.includes('snow-bough'))).toBe(true);
    expect(art.some((piece) => piece.id.includes('charred-branch'))).toBe(true);
    expect(art.some((piece) => piece.id.includes('dead-shrub'))).toBe(true);
    expect(art.some((piece) => piece.id.includes('volcanic-fissure'))).toBe(true);
    expect(art.filter((piece) => piece.sceneryAnimation === 'lava-flow')).toHaveLength(2);
    expect(map).toEqual(before);
  });

  it.each(['snow', 'lava'] as const)(
    'retains the existing tree collider and mirrored ownership for %s vegetation',
    (kind) => {
      for (const n of [1, 3]) {
        const art = new MapBiomeVegetationBuilder().build('tree', { x: 100, y: 100 }, 15, n, kind);
        const solids = art.filter((piece) => piece.object?.isFootprint === true);
        expect(solids).toHaveLength(1);
        expect(solids[0]?.shape).toEqual([
          { x: 99, y: 100 },
          { x: 102, y: 100 },
          { x: 102, y: 100 + (n === 3 ? 9 : 10) },
          { x: 99, y: 100 + (n === 3 ? 9 : 10) },
        ]);
        expect(art.every((piece) => piece.object?.id === 'tree' && piece.isMirrored === true)).toBe(
          true,
        );
      }
      expect(sceneryBiomeAt({ x: 800, y: 80 })).toBe('snow');
      expect(sceneryBiomeAt({ x: 800, y: 820 })).toBe('lava');
      expect(sceneryBiomeAt({ x: 130, y: 450 })).toBeUndefined();
    },
  );
});
