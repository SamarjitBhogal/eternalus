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

  it('is solid unless it is built as a walk-on outline', () => {
    const floor = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
    ];

    expect(new Footprint([floor]).walkOn).toEqual([]);
    expect(new Footprint([floor]).solid).toEqual([floor]);
    expect(new Footprint([floor], { isWalkOn: true }).walkOn).toEqual([floor]);
    expect(new Footprint([floor], { isWalkOn: true }).solid).toEqual([]);
  });

  it('adds the solid polygons of its other body objects to a walk-on outline (DEC-373 (1))', () => {
    const floor = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
    ];
    const wall = [
      { x: 6, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: 10 },
    ];
    const footprint = new Footprint([floor], { isWalkOn: true, solid: [wall] });

    expect(footprint.polygons).toEqual([floor, wall]);
    expect(footprint.walkOn).toEqual([floor]);
    expect(footprint.solid).toEqual([wall]);
    expect(footprint.bounds).toEqual({ x: 0, y: 0, width: 8, height: 10 });
    expect(new Footprint([wall], { solid: [floor] }).solid).toEqual([wall, floor]);
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
