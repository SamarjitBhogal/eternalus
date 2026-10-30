import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { strongholdRing } from './strongholdRing';

describe('strongholdRing', () => {
  it.each([100, 110, 120])(
    'uses generated ring geometry at radius %i with no presentation layout override',
    (radius) => {
      const ring = { ...DEFAULT_MAP_LAYOUT.wallRing, radius, thickness: 12 };
      const map = new MapGenerator({ layout: { ...DEFAULT_MAP_LAYOUT, wallRing: ring } }).generate(
        createDefaultGameConfig(),
        1,
      );
      const presentation = new MapPresentationBuilder().build(map);
      for (const feature of map.features.filter((entry) => entry.kind === 'stronghold')) {
        const actual = strongholdRing(map, feature);
        expect(actual.radius).toBeCloseTo(ring.radius);
        expect(actual.thickness).toBeCloseTo(ring.thickness);
        for (const piece of presentation.scenery.filter(
          (entry) => entry.buildingId === feature.id && entry.visibility === 'roof',
        ))
          for (const point of piece.shape)
            expect(
              Math.hypot(point.x - feature.position.x, point.y - feature.position.y),
            ).toBeLessThan(ring.radius - ring.thickness);
      }
    },
  );
  it('rejects a stronghold with no generated wall footprint instead of guessing default dimensions', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const feature = map.features.find((entry) => entry.kind === 'stronghold');
    if (feature === undefined) throw new Error('Missing stronghold');
    expect(() => strongholdRing({ ...map, features: [feature] }, feature)).toThrow(
      'Missing generated wall ring',
    );
  });
});
