import { describe, expect, it } from 'vitest';

import { Footprint } from './Footprint';

describe('Footprint', () => {
  it('keeps its polygons and the box around all of them', () => {
    const wall = [
      { x: -16, y: -16 },
      { x: 16, y: -16 },
      { x: 16, y: -12.8 },
      { x: -16, y: -12.8 },
    ];
    const keep = [
      { x: -5, y: -6 },
      { x: 5, y: -6 },
      { x: 5, y: 20 },
      { x: -5, y: 20 },
    ];
    const footprint = new Footprint([wall, keep]);

    expect(footprint.polygons).toEqual([wall, keep]);
    expect(footprint.bounds).toEqual({ x: -16, y: -16, width: 32, height: 36 });
  });

  it('rejects no polygon, or one with fewer than 3 corners', () => {
    expect(() => new Footprint([])).toThrow(/at least one polygon/);
    expect(
      () =>
        new Footprint([
          [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
          ],
        ]),
    ).toThrow(/at least 3 corners/);
  });
});
