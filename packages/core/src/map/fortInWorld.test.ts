import { describe, expect, it } from 'vitest';

import { assertFortWallsResolve, fortInWorld } from './fortInWorld';
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

  it('throws in a world narrower than the cell allows', () => {
    expect(() => {
      assertFortWallsResolve({ width: 1200, height: 900 }, 2.5);
    }).toThrow(/map\.navCellSize = 2\.5.*map\.worldWidth = 1200.*map\.worldHeight = 900/);
  });

  it.each([3.2, 4])('throws with a navCellSize of %f at 1600 x 900', (navCellSize) => {
    expect(() => {
      assertFortWallsResolve({ width: 1600, height: 900 }, navCellSize);
    }).toThrow(MapGenerationError);
  });
});
