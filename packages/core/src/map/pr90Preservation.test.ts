import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { fnv1a } from '../utils/fnv1a';
import { canonicalJson } from '../utils/canonicalJson';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';

describe('PR 90 preservation at approved head 2a53e882', () => {
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
      expect({
        scenery: fnv1a(canonicalJson(presentation)),
        collision: fnv1a(canonicalJson(objects)),
        towers: fnv1a(canonicalJson(towers)),
        camps: fnv1a(canonicalJson(camps)),
        towerCount: towers.length,
        campCount: camps.length,
      }).toMatchSnapshot();
    },
  );
});
