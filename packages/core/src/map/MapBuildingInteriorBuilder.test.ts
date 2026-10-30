import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MapGenerator } from './MapGenerator';
import type { Rect } from '../utils/geometry.types';
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
          const insideRect = (rect: Rect) =>
            x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
          const feature = MAP_1.features.find((entry) => entry.id === building.id);
          if (feature === undefined) throw new Error('Missing building');
          const { nave, transept, apse } = G.cathedral;
          const isInside =
            feature.kind === 'cathedral'
              ? insideRect(nave) ||
                insideRect(transept) ||
                ((x - apse.x) / apse.radiusX) ** 2 + ((y - apse.y) / apse.radiusY) ** 2 <= 1.001 ||
                insideRect(G.northDoor)
              : ((x - feature.position.x) / (G.palace.floorRadiusX * scale)) ** 2 +
                  ((y - feature.position.y) / (G.palace.floorRadiusY * scale)) ** 2 <=
                1.001;
          expect(isInside, `${piece.id}: ${String(x)}, ${String(y)}`).toBe(true);
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
