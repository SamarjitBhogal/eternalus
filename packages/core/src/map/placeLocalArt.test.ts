import { describe, expect, it } from 'vitest';
import type { MapDecoration } from '../content/maps/maps.types';
import { placeLocalArt } from './placeLocalArt';

describe('placeLocalArt', () => {
  it('preserves exact floating-point reflection instead of subtracting offsets from the far origin', () => {
    const width = 1600,
      x = 15.75,
      scale = 0.82;
    const pieces: readonly MapDecoration[] = [
      { id: 'fractional', color: 'grey', layer: 'detail', shape: [{ x: 19.98, y: 1 }] },
    ];
    const west = placeLocalArt(pieces, { x, y: 0 }, scale, false);
    const east = placeLocalArt(pieces, { x: width - x, y: 0 }, scale, true, width);
    expect(east[0]?.shape[0]?.x).toBe(width - (west[0]?.shape[0]?.x ?? Number.NaN));
    expect(east[0]?.shape[0]?.x).not.toBe(width - x - 19.98 * scale);
  });
  it('scales and reflects artwork while preserving ownership and source polygons', () => {
    const pieces: readonly MapDecoration[] = [
      {
        id: 'stone',
        color: 'grey',
        layer: 'detail',
        shape: [
          { x: -2, y: 1 },
          { x: 2, y: 1 },
          { x: 0, y: 4 },
        ],
        object: { id: 'camp', kind: 'camp', isFootprint: true },
      },
    ];
    const before = structuredClone(pieces);
    expect(placeLocalArt(pieces, { x: 10, y: 20 }, 2, false)[0]?.shape).toEqual([
      { x: 6, y: 22 },
      { x: 14, y: 22 },
      { x: 10, y: 28 },
    ]);
    expect(placeLocalArt(pieces, { x: 30, y: 20 }, 2, true)[0]).toEqual({
      ...pieces[0],
      shape: [
        { x: 34, y: 22 },
        { x: 26, y: 22 },
        { x: 30, y: 28 },
      ],
    });
    expect(pieces).toEqual(before);
  });
});
