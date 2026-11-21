import { describe, expect, it } from 'vitest';

import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { assertFortWallsResolve, fortInWorld, fortWallBands } from './fortInWorld';
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
  it("gives a lane tower fort box's north and south wall bands, one wall thick, per axis (DEC-315)", () => {
    const box = { x: 100, y: 200, width: 112, height: 56 };
    const { wallHeight } = fortInWorld(G.fort.laneTowerSize, { width: 3200, height: 900 });

    expect(fortWallBands(box, { width: 3200, height: 900 })).toEqual([
      { x: 100, y: 200, width: 112, height: wallHeight },
      { x: 100, y: 256 - wallHeight, width: 112, height: wallHeight },
    ]);
  });
});
