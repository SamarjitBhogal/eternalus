import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { MapGenerator } from './MapGenerator';
import { MapStrongholdBuilder } from './MapStrongholdBuilder';
describe('MapStrongholdBuilder', () => {
  it.each([DEFAULT_MAP_LAYOUT.wallRing.radius, 110])(
    'keeps the oval and roof beneath the generated ring with no fixed-angle decorative towers at radius %i',
    (radius) => {
      const layout = {
        ...DEFAULT_MAP_LAYOUT,
        wallRing: { ...DEFAULT_MAP_LAYOUT.wallRing, radius },
      };
      const map = new MapGenerator({ layout }).generate(createDefaultGameConfig(), 1);
      for (const feature of map.features.filter((f) => f.kind === 'stronghold')) {
        const pieces = new MapStrongholdBuilder().build(feature, layout.wallRing);
        expect(pieces.every((p) => p.layer === 'ground' && p.buildingId === feature.id)).toBe(true);
        expect(pieces.some((p) => p.id.includes('wall-tower'))).toBe(false);
        const wall = pieces.find((p) => p.id.endsWith('stronghold-wall'));
        expect(wall?.shape).toHaveLength(64);
        expect(wall?.visibility).toBeUndefined();
        expect(pieces.some((p) => p.visibility === 'roof')).toBe(true);
        expect(
          pieces.every((p) =>
            p.shape.every(
              (point) =>
                Math.hypot(point.x - feature.position.x, point.y - feature.position.y) <
                layout.wallRing.radius - layout.wallRing.thickness,
            ),
          ),
        ).toBe(true);
      }
    },
  );
});
