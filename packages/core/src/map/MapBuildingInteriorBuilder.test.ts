import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
const MAP_1 = new MapGenerator().generate(createDefaultGameConfig(), 1);
const scale =
  (DEFAULT_MAP_LAYOUT.wallRing.radius -
    DEFAULT_MAP_LAYOUT.wallRing.thickness -
    G.stronghold.clearance) /
  G.stronghold.extent;
describe('MapBuildingInteriorBuilder', () => {
  it('fits furnished interiors to the same-world building footprints', () => {
    const presentation = new MapPresentationBuilder().build(MAP_1);
    const map = { ...MAP_1, ...presentation };
    expect(
      map.scenery.filter((piece) => piece.id.startsWith('cathedral-interior-wall-')),
    ).toHaveLength(14);
    for (const detail of [
      'window-',
      'candle-',
      'chapel-bench-',
      'open-book',
      'altar-inlay',
      'sacristy-cabinet',
    ])
      expect(
        map.scenery.some(
          (piece) => piece.id.startsWith('cathedral-interior-') && piece.id.includes(detail),
        ),
      ).toBe(true);
    for (const id of [
      'light-stronghold-stronghold-wall',
      'dark-stronghold-stronghold-wall',
      'cathedral-buttress-746-0',
    ])
      expect(map.scenery.find((piece) => piece.id === id)?.visibility).toBeUndefined();
    for (const building of map.buildings) {
      const pieces = map.scenery.filter(
        (piece) => piece.buildingId === building.id && piece.visibility === 'interior',
      );
      expect(pieces.length).toBeGreaterThan(20);
      expect(building.footprint.length).toBeGreaterThan(0);
      expect(
        map.scenery.some(
          (piece) => piece.buildingId === building.id && piece.visibility === 'roof',
        ),
      ).toBe(true);
      for (const piece of pieces)
        for (const p of piece.shape) {
          const x = p.x;
          const y = p.y;
          const isInside =
            building.id === 'cathedral-lane-1'
              ? (x >= 755 && x <= 845 && y >= 342 && y <= 553) ||
                (x >= 703 && x <= 897 && y >= 420 && y <= 485) ||
                ((x - 800) / 44) ** 2 + ((y - 344) / 26) ** 2 <= 1.001 ||
                (x >= 788 && x <= 812 && y >= 320 && y <= 332)
              : ((x - (building.id === 'light-stronghold' ? 130 : 1470)) /
                  (G.palace.floorRadiusX * scale)) **
                  2 +
                  ((y - 450) / (G.palace.floorRadiusY * scale)) ** 2 <=
                1.001;
          expect(isInside).toBe(true);
        }
    }
    for (const part of [
      'pew',
      'column',
      'chapel',
      'altar',
      'capture-floor',
      'north-door',
      'south-door',
    ])
      expect(
        map.scenery.some((piece) => piece.visibility === 'interior' && piece.id.includes(part)),
      ).toBe(true);
    for (const team of ['light', 'dark'])
      expect(map.scenery.some((piece) => piece.id === `${team}-palace-interior-throne-back`)).toBe(
        true,
      );
  });
});
