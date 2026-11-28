import { describe, expect, it } from 'vitest';
import type { MapDecoration } from '../content/maps/maps.types';
import { doPolygonsOverlap } from '../utils/geometry';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { MapMountainBuilder } from './MapMountainBuilder';

const NW = 'mountain-corner-nw-93-278';

// Seed 3 at the default world, which is the scenery sketch size (1600 x 900).
const MAP = new MapGenerator().generate(createDefaultGameConfig(), 3);

const massOf = (pieces: readonly MapDecoration[], objectId: string) =>
  pieces.find(({ id }) => id === `${objectId}-mass`)?.shape ?? [];

const widthOf = (shape: MapDecoration['shape']) =>
  Math.max(...shape.map(({ x }) => x)) - Math.min(...shape.map(({ x }) => x));

describe('MapMountainBuilder', () => {
  it('draws each mountain whose mass touches a keep-clear area at the largest clear size step, and keeps the others as they were (HC-Q95)', () => {
    const all = new MapMountainBuilder().build(MAP);
    const corner = massOf(all, NW)[0] ?? { x: 0, y: 0 };
    // 0.45 of the way from the NW mountain's anchor (inside its mass) to a corner of its
    // full-size mass: the mass touches it at 50 % of full size and is clear at 40 %.
    const area = [{ x: 93 + (corner.x - 93) * 0.45, y: 278 + (corner.y - 278) * 0.45 }];
    const kept = new MapMountainBuilder([area]).build(MAP);
    const touched = new Set(
      all
        .filter(
          ({ object, shape }) => object?.isFootprint === true && doPolygonsOverlap(shape, area),
        )
        .map(({ object }) => object?.id ?? ''),
    );

    expect(touched.has(NW)).toBe(true);
    expect(widthOf(massOf(kept, NW)) / widthOf(massOf(all, NW))).toBeCloseTo(0.4);
    for (const id of touched) {
      expect(massOf(kept, id).length).toBeGreaterThan(0);
      expect(doPolygonsOverlap(massOf(kept, id), area)).toBe(false);
      expect(widthOf(massOf(kept, id))).toBeLessThan(widthOf(massOf(all, id)));
    }
    const untouched = (pieces: readonly MapDecoration[]) =>
      pieces.filter(({ object }) => !touched.has(object?.id ?? ''));
    expect(untouched(kept)).toEqual(untouched(all));
  });

  it('leaves out, art and all, a mountain whose mass touches the area even at its smallest size (HC-Q95)', () => {
    // The mountain's anchor point is inside its mass at every size.
    const kept = new MapMountainBuilder([[{ x: 93, y: 278 }]]).build(MAP);

    expect(kept.filter(({ id }) => id.startsWith(`${NW}-`))).toEqual([]);
    expect(kept.some(({ id }) => id === 'hill-0-mass')).toBe(true);
  });
});
