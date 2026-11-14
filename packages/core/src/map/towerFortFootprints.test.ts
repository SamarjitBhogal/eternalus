import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { SKETCH_WIDTH, SKETCH_HEIGHT } from '../content/maps/map1Scenery';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';
import { MapFortificationBuilder } from './MapFortificationBuilder';

describe('DEC-238 tower forts', () => {
  it.each([1, 2, 42])(
    'keeps every tower fort footprint and leaves shrine art nonblocking for seed %s',
    (seed) => {
      const map = new MapGenerator().generate(createDefaultGameConfig(), seed);
      const presentation = new MapPresentationBuilder().build(map);
      const objects = new MapObjectBuilder().build(map, presentation);
      const sx = map.width / SKETCH_WIDTH,
        sy = map.height / SKETCH_HEIGHT;
      for (const tower of map.features.filter(
        (feature) => feature.kind === 'spawner-tower' || feature.kind === 'buff-tower',
      )) {
        const expected = new MapFortificationBuilder()
          .build({ ...tower, position: { x: tower.position.x / sx, y: tower.position.y / sy } })
          .filter((piece) => piece.object?.isFootprint)
          .map((piece) => piece.shape.map((point) => ({ x: point.x * sx, y: point.y * sy })));
        expect(expected).toHaveLength(12);
        const object = objects.find((entry) => entry.id === tower.id);
        expect(object?.footprints).toEqual(expected);
        expect(object?.kind).toBe(tower.kind);
        expect(
          presentation.scenery
            .filter((piece) => piece.replacesFeature === tower.id)
            .every((piece) => piece.object?.isFootprint === false),
        ).toBe(true);
      }
    },
  );
});
