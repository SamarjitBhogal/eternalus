import { describe, expect, it } from 'vitest';

import type { MapObject } from '../content/maps/mapObjects.types';
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

  describe('ofBody', () => {
    const square = (x: number) => [
      { x, y: 0 },
      { x: x + 2, y: 0 },
      { x: x + 2, y: 2 },
      { x, y: 2 },
    ];
    const object = (id: string, x: number, isBlocking: boolean): MapObject => ({
      id,
      kind: 'wall',
      footprints: [square(x)],
      isBlocking,
    });

    it("builds a structure's body: its own object's polygons, then its parts as solid ones", () => {
      const palace = object('palace', 0, false);
      const fort = object('fort', 0, true);
      const wall = object('wall', 10, true);

      const walkOn = Footprint.ofBody(palace, [wall]);
      expect(walkOn?.walkOn).toEqual([square(0)]);
      expect(walkOn?.solid).toEqual([square(10)]);

      const solid = Footprint.ofBody(fort, []);
      expect(solid?.walkOn).toEqual([]);
      expect(solid?.solid).toEqual([square(0)]);
    });

    it('builds a body of parts alone as solid, and none for a structure with neither', () => {
      const parts = Footprint.ofBody(undefined, [object('a', 0, true), object('b', 10, true)]);

      expect(parts?.polygons).toEqual([square(0), square(10)]);
      expect(parts?.walkOn).toEqual([]);
      expect(parts?.solid).toEqual([square(0), square(10)]);
      expect(Footprint.ofBody(undefined, [])).toBeUndefined();
    });
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
