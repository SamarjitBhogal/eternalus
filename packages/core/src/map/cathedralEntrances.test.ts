import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';
import { isPointInPolygon } from '../utils/geometry';
import { doesCircleOverlapPolygon } from '../utils/circlePolygon';

describe('cathedral lane entrances', () => {
  it.each([
    [1600, 900],
    [2400, 1200],
  ])(
    'marks both side portals and preserves the walkable lane through them at %i by %i',
    (width, height) => {
      const config = createDefaultGameConfig({ map: { worldWidth: width, worldHeight: height } });
      const map = new MapGenerator().generate(config, 1);
      const presentation = new MapPresentationBuilder().build(map);
      const objects = new MapObjectBuilder().build(map, presentation);
      const building = presentation.buildings.find((b) => b.id === 'cathedral-lane-1');
      for (const [side, door] of [
        ['west', G.westDoor],
        ['east', G.eastDoor],
      ] as const) {
        const centre = {
          x: ((door.x + door.width / 2) * width) / 1600,
          y: ((door.y + door.height / 2) * height) / 900,
        };
        const exterior = presentation.scenery.find((p) => p.id === `cathedral-${side}-door`);
        const interior = presentation.scenery.find(
          (p) => p.id === `cathedral-interior-${side}-door`,
        );
        expect(exterior?.visibility).toBe('roof');
        expect(interior?.visibility).toBe('interior');
        expect(exterior?.shape).toHaveLength(interior?.shape.length ?? 0);
        exterior?.shape.forEach((point, i) => {
          expect(point.x).toBeCloseTo(interior?.shape[i]?.x ?? Number.NaN, 9);
          expect(point.y).toBeCloseTo(interior?.shape[i]?.y ?? Number.NaN, 9);
        });
        expect(building?.footprint.some((shape) => isPointInPolygon(centre, shape))).toBe(true);
        expect(
          presentation.scenery.filter((p) => p.id.startsWith(`cathedral-${side}-step-`)),
        ).toHaveLength(5);
        expect(
          objects
            .filter((o) => o.buildingId === building?.id && o.isBlocking)
            .some((o) => o.footprints.some((shape) => doesCircleOverlapPolygon(centre, 1, shape))),
        ).toBe(false);
      }
      for (let x = G.westDoor.x; x <= G.eastDoor.x + G.eastDoor.width; x += 2) {
        const point = { x: (x * width) / 1600, y: (455 * height) / 900 };
        expect(
          objects
            .filter((o) => o.buildingId === building?.id && o.isBlocking)
            .some((o) => o.footprints.some((shape) => doesCircleOverlapPolygon(point, 1, shape))),
        ).toBe(false);
      }
    },
  );
});
