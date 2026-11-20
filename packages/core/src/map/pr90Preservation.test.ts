import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { fnv1a } from '../utils/fnv1a';
import { canonicalJson } from '../utils/canonicalJson';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';

// Ignore last-bit differences in decorative geometry across engines and CPUs (ADR 0012).
const SCENERY_DECIMAL_PLACES = 6;

describe('Map scenery and collision preservation', () => {
  it.each([1, 2, 42])(
    'pins scenery and all collision, including tower and camp footprints, for seed %s',
    (seed) => {
      const map = new MapGenerator().generate(createDefaultGameConfig(), seed);
      const presentation = new MapPresentationBuilder().build(map);
      const objects = new MapObjectBuilder().build(map, presentation);
      const towers = objects.filter(
        (object) => object.kind === 'spawner-tower' || object.kind === 'buff-tower',
      );
      const camps = objects.filter((object) => object.kind === 'camp');
      const roundedScenery: unknown = JSON.parse(
        canonicalJson(presentation),
        (_key: string, value: unknown) =>
          typeof value === 'number' ? Number(value.toFixed(SCENERY_DECIMAL_PLACES)) : value,
      );
      expect({
        scenery: fnv1a(canonicalJson(roundedScenery)),
        collision: fnv1a(canonicalJson(objects)),
        towers: fnv1a(canonicalJson(towers)),
        camps: fnv1a(canonicalJson(camps)),
        towerCount: towers.length,
        campCount: camps.length,
      }).toMatchSnapshot();
    },
  );
});
