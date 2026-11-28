import { describe, expect, it } from 'vitest';

import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { FortWallRole, MapObject } from '../content/maps/mapObjects.types';
import { bodyObjectsOf, fortBox } from './__fixtures__/fortBody';
import { assertFortWallsResolve, fortInWorld, fortWallBands } from './fortInWorld';
import { MapGenerator } from './MapGenerator';
import { MapObjectBuilder } from './MapObjectBuilder';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapGenerationError } from './MapGenerationError';

describe('fortInWorld', () => {
  it('returns the sketch fort unchanged in a sketch-sized world', () => {
    expect(fortInWorld(32, { width: 1600, height: 900 })).toEqual({
      width: 32,
      height: 32,
      wallWidth: 3.2,
      wallHeight: 3.2,
    });
  });

  it('stretches the side and the wall per axis', () => {
    expect(fortInWorld(32, { width: 3200, height: 900 })).toEqual({
      width: 64,
      height: 32,
      wallWidth: 6.4,
      wallHeight: 3.2,
    });
  });
});

describe('assertFortWallsResolve', () => {
  it('passes at 1600 x 900 with 2.5 m cells', () => {
    expect(() => {
      assertFortWallsResolve({ width: 1600, height: 900 }, 2.5);
    }).not.toThrow();
  });

  // A lane tower fort's wall at 1600 x 900, in metres (the side over the wall divisor).
  const wall = G.fort.laneTowerSize / G.fort.wallDivisor;

  it('throws in a world narrower than the cell allows', () => {
    // A world this narrow stretches the wall to under 2.5 m across.
    const width = Math.floor((1600 * 2.5) / wall) - 1;
    expect(() => {
      assertFortWallsResolve({ width, height: 900 }, 2.5);
    }).toThrow(
      new RegExp(
        `map\\.navCellSize = 2\\.5.*map\\.worldWidth = ${String(width)}.*map\\.worldHeight = 900`,
      ),
    );
  });

  it.each([0, 1])('throws with a navCellSize %f m over the wall at 1600 x 900', (over) => {
    expect(() => {
      assertFortWallsResolve({ width: 1600, height: 900 }, wall + over);
    }).toThrow(MapGenerationError);
  });
});

describe('fortWallBands', () => {
  const objectsOf = (width: number, height: number) => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(
      { map: { ...config.map, worldWidth: width, worldHeight: height } },
      1,
    );
    return {
      map,
      objects: new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map)),
    };
  };

  it.each([
    [1600, 900],
    [3200, 900],
  ])(
    "gives each lane tower fort's north and south wall bands from its wall objects, one wall thick, per axis (DEC-315; %i x %i world)",
    (width, height) => {
      const { map, objects } = objectsOf(width, height);
      const towers = map.features.filter(
        ({ definitionId }) => MAP_FEATURE_DEFINITIONS[definitionId]?.isCourt === true,
      );
      const { wallHeight } = fortInWorld(G.fort.laneTowerSize, { width, height });

      expect(towers.length).toBeGreaterThan(0);
      for (const { id } of towers) {
        const box = fortBox(objects, id);
        const [north, south, ...more] = fortWallBands(bodyObjectsOf(objects, id));
        expect(more).toEqual([]);
        expect(north?.x).toBeCloseTo(box.x);
        expect(north?.width).toBeCloseTo(box.width);
        expect(north?.y).toBeCloseTo(box.y);
        expect(north?.height).toBeCloseTo(wallHeight);
        expect(south?.x).toBeCloseTo(box.x);
        expect(south?.width).toBeCloseTo(box.width);
        expect(south?.y).toBeCloseTo(box.y + box.height - wallHeight);
        expect(south?.height).toBeCloseTo(wallHeight);
      }
    },
  );

  it('gives no band for a fort whose wall piece is gone, and ignores objects that are not its walls', () => {
    const box = (id: string, fortWall: FortWallRole | undefined, y: number): MapObject => ({
      id,
      kind: 'wall',
      isBlocking: true,
      ...(fortWall === undefined ? {} : { fortWall }),
      footprints: [
        [
          { x: 0, y },
          { x: 10, y },
          { x: 10, y: y + 1 },
          { x: 0, y: y + 1 },
        ],
      ],
    });

    expect(fortWallBands([])).toEqual([]);
    expect(
      fortWallBands([
        box('a-fort-wall-top', 'top', 0),
        box('a-fort-wall-left', 'left', 5),
        box('rock', undefined, 7),
      ]),
    ).toEqual([{ x: 0, y: 0, width: 10, height: 1 }]);
  });
});
