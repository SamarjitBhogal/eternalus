import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
const MAP_1_SCALE = 1;
const MAP_1 = new MapGenerator().generate(createDefaultGameConfig(), 1);
import { MapLayout } from './MapLayout';

describe('MapLayout', () => {
  it('opens permanent gates on all lanes and leads the throne carpet to the middle gate', () => {
    const map = new MapLayout().build(MAP_1);
    for (const team of ['light', 'dark']) {
      const center = team === 'light' ? 130 : 1470;
      for (const lane of map.lanes) {
        const gate = map.scenery?.find((p) => p.id === `${team}-stronghold-${lane.id}-gate-bridge`);
        expect(gate).toBeDefined();
        expect(gate?.visibility).toBeUndefined();
        const points = gate?.shape ?? [];
        const inner = {
          x: ((points[0]?.x ?? 0) + (points[3]?.x ?? 0)) / 2,
          y: ((points[0]?.y ?? 0) + (points[3]?.y ?? 0)) / 2,
        };
        expect(((inner.x - center) / 90) ** 2 + ((inner.y - 450) / 101) ** 2).toBeLessThan(1);
        const outer = {
          x: ((points[1]?.x ?? 0) + (points[2]?.x ?? 0)) / 2,
          y: ((points[1]?.y ?? 0) + (points[2]?.y ?? 0)) / 2,
        };
        expect(((outer.x - center) / 110) ** 2 + ((outer.y - 450) / 125) ** 2).toBeGreaterThan(1);
      }
      const carpet = map.scenery?.find((p) => p.id === `${team}-palace-interior-carpet`);
      const xs = carpet?.shape.map((p) => p.x / MAP_1_SCALE) ?? [];
      const ys = carpet?.shape.map((p) => p.y / MAP_1_SCALE) ?? [];
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(130);
      expect((Math.max(...ys) + Math.min(...ys)) / 2).toBe(450);
      expect(team === 'light' ? Math.max(...xs) : Math.min(...xs)).toBeCloseTo(
        center + (team === 'light' ? 1 : -1) * 99 * (90 / 101),
      );
    }
  });
  it('surrounds the battlefield with mountains and local, bridged biomes', () => {
    const map = new MapLayout().build(MAP_1);
    const scenery = map.scenery ?? [];
    for (const edge of ['north', 'south', 'west', 'east']) {
      const masses = scenery.filter(
        (piece) => piece.id.startsWith(`mountain-${edge}-`) && piece.id.endsWith('-mass'),
      );
      expect(masses.length).toBeGreaterThan(10);
      const axis = edge === 'north' || edge === 'south' ? 'x' : 'y';
      const coordinates = masses.flatMap((piece) => piece.shape.map((point) => point[axis]));
      expect(Math.min(...coordinates)).toBe(0);
      expect(Math.max(...coordinates)).toBe(axis === 'x' ? map.width : map.height);
      const widths = masses.map(
        (piece) =>
          Math.max(...piece.shape.map((p) => p.x)) - Math.min(...piece.shape.map((p) => p.x)),
      );
      expect(new Set(widths).size).toBeGreaterThan(5);
    }
    for (const prefix of [
      'snow-pocket-',
      'lava-weathering-',
      'lava-river-',
      'lava-bridge-',
      'lake-deep-',
      'hill-',
      'tree-',
    ])
      expect(scenery.some((piece) => piece.id.startsWith(prefix))).toBe(true);
    expect(
      scenery.some(
        (piece) =>
          piece.id === 'snow-region' || piece.id === 'ash-region' || piece.id === 'city-plaza',
      ),
    ).toBe(false);
    for (const id of ['light-stronghold', 'dark-stronghold']) {
      const court = scenery.find((piece) => piece.id === `${id}-stronghold-wall`);
      expect(court).toBeDefined();
      expect(court?.shape).toHaveLength(64);
      expect(scenery.find((piece) => piece.id === `${id}-palace-roof`)?.shape).toHaveLength(64);
      expect(
        Math.max(...(court?.shape.map((point) => point.x) ?? [])) -
          Math.min(...(court?.shape.map((point) => point.x) ?? [])),
      ).toBe(220);
    }
    expect(map.buildings).toHaveLength(3);
    expect(scenery.some((piece) => piece.id === 'cathedral-north-door')).toBe(true);
  });
  it('preserves all generated geometry while adding presentation', () => {
    const map = new MapLayout().build(MAP_1);
    expect(map.width).toBe(1600);
    expect(map.height).toBe(900);
    for (const original of MAP_1.features) {
      expect(map.features.find((feature) => feature.id === original.id)).toEqual({
        ...original,
        position: { x: original.position.x * MAP_1_SCALE, y: original.position.y * MAP_1_SCALE },
      });
    }
    expect(map.lanes.map((lane) => lane.id)).toEqual(MAP_1.lanes.map((lane) => lane.id));
    expect(map.lanes).toEqual(MAP_1.lanes);
    expect(map.terrain).toEqual(MAP_1.terrain);
  });

  it('creates repeatable scenery, generated neutral camps and distinct capture landmarks', () => {
    const first = new MapLayout().build(MAP_1);
    const second = new MapLayout().build(MAP_1);
    expect(first).toEqual(second);
    expect(first.features.filter((feature) => feature.kind === 'camp')).toHaveLength(
      MAP_1.features.filter((f) => f.kind === 'camp').length,
    );
    expect(
      first.features
        .filter((feature) => feature.kind === 'camp')
        .every((feature) => feature.team === 'neutral'),
    ).toBe(true);
    expect(
      first.scenery?.find((piece) => piece.id === 'capture-point-lane-0-fort-keep-roof')?.color,
    ).not.toBe(
      first.scenery?.find((piece) => piece.id === 'capture-point-lane-2-fort-keep-roof')?.color,
    );
    expect(first.scenery?.some((piece) => piece.id.startsWith('village-'))).toBe(true);
    expect(first.scenery?.some((piece) => piece.id.startsWith('tree-'))).toBe(true);
  });

  it('keeps scenery inside the world with unique ids and valid polygons', () => {
    const map = new MapLayout().build(MAP_1);
    const scenery = map.scenery ?? [];
    expect(scenery.length).toBeGreaterThan(1000);
    expect(new Set(scenery.map((piece) => piece.id)).size).toBe(scenery.length);
    expect(
      scenery.every(
        (piece) =>
          piece.shape.length >= 3 &&
          piece.shape.every(
            (point) =>
              Number.isFinite(point.x) &&
              Number.isFinite(point.y) &&
              point.x >= 0 &&
              point.y >= 0 &&
              point.x <= map.width &&
              point.y <= map.height,
          ),
      ),
    ).toBe(true);
  });

  it('fits furnished interiors to the same-world building footprints', () => {
    const map = new MapLayout().build(MAP_1);
    for (const team of ['light', 'dark'])
      for (const room of ['council', 'library', 'kitchen', 'bedchamber', 'armory', 'dining']) {
        for (const part of [
          'floor',
          'wall-north',
          'wall-south',
          'wall-west',
          'wall-east',
          'doorway',
        ])
          expect(
            map.scenery?.some((piece) => piece.id === `${team}-palace-interior-${room}-${part}`),
          ).toBe(true);
      }
    expect(
      map.scenery?.filter((piece) => piece.id.startsWith('cathedral-interior-wall-')),
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
        map.scenery?.some(
          (piece) => piece.id.startsWith('cathedral-interior-') && piece.id.includes(detail),
        ),
      ).toBe(true);
    for (const id of [
      'light-stronghold-stronghold-wall',
      'dark-stronghold-stronghold-wall',
      'cathedral-buttress-746-0',
    ])
      expect(map.scenery?.find((piece) => piece.id === id)?.visibility).toBeUndefined();
    for (const building of map.buildings ?? []) {
      const pieces =
        map.scenery?.filter(
          (piece) => piece.buildingId === building.id && piece.visibility === 'interior',
        ) ?? [];
      expect(pieces.length).toBeGreaterThan(20);
      expect(building.footprint.length).toBeGreaterThan(0);
      expect(
        map.scenery?.some(
          (piece) => piece.buildingId === building.id && piece.visibility === 'roof',
        ),
      ).toBe(true);
      for (const piece of pieces)
        for (const p of piece.shape) {
          const x = p.x / MAP_1_SCALE;
          const y = p.y / MAP_1_SCALE;
          const isInside =
            building.id === 'cathedral-lane-1'
              ? (x >= 755 && x <= 845 && y >= 342 && y <= 553) ||
                (x >= 703 && x <= 897 && y >= 420 && y <= 485) ||
                ((x - 800) / 44) ** 2 + ((y - 344) / 26) ** 2 <= 1.001 ||
                (x >= 788 && x <= 812 && y >= 320 && y <= 332)
              : ((x - (building.id === 'light-stronghold' ? 130 : 1470)) / 90) ** 2 +
                  ((y - 450) / 101) ** 2 <=
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
        map.scenery?.some((piece) => piece.visibility === 'interior' && piece.id.includes(part)),
      ).toBe(true);
    for (const team of ['light', 'dark'])
      expect(map.scenery?.some((piece) => piece.id === `${team}-palace-interior-throne-back`)).toBe(
        true,
      );
  });
});
