import { describe, expect, it } from 'vitest';
import { MapBiomeVegetationBuilder } from './MapBiomeVegetationBuilder';
import { BIOME_KINDS } from '../content/maps/biomeScenery';

describe('MapBiomeVegetationBuilder', () => {
  it('retains tree identity and exact trunk collision for every biome and tree form', () => {
    for (const kind of BIOME_KINDS) {
      for (const n of [1, 3]) {
        const art = new MapBiomeVegetationBuilder().build('tree', { x: 50, y: 60 }, 12, n, kind);
        expect(
          art.filter((piece) => piece.object?.isFootprint).map((piece) => piece.shape),
        ).toEqual([
          [
            { x: 49, y: 60 },
            { x: 52, y: 60 },
            { x: 52, y: n === 3 ? 69 : 70 },
            { x: 49, y: n === 3 ? 69 : 70 },
          ],
        ]);
        expect(art.every((piece) => piece.object?.id === 'tree' && piece.isMirrored === true)).toBe(
          true,
        );
        expect(
          new MapBiomeVegetationBuilder().build('tree', { x: 50, y: 60 }, 12, n, kind),
        ).toEqual(art);
      }
    }
  });
});
