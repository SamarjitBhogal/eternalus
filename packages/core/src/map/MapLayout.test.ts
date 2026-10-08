import { describe, expect, it } from 'vitest';
import { MAP_1 } from '../content/maps/map1';
import { MAP_1_SCALE, CAMP_POSITIONS } from '../content/maps/map1Scenery';
import { MapLayout } from './MapLayout';

describe('MapLayout', () => {
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
    const interior = map.interior;
    expect(
      interior?.features.find((feature) => feature.id === 'cathedral-interior-capture')?.position,
    ).toEqual({ x: 900, y: 1100 });
    expect(interior?.scenery?.find((piece) => piece.id === 'rotunda-floor')?.shape).toHaveLength(
      64,
    );
    const court = interior?.scenery?.find((piece) => piece.id === 'capture-court-floor');
    expect(court?.shape).toHaveLength(64);
    expect(
      interior?.scenery
        ?.filter((piece) => piece.id.startsWith('pew-') || piece.id.startsWith('column-'))
        .every((piece) => piece.shape.every((p) => Math.hypot(p.x - 900, p.y - 1100) > 200)),
    ).toBe(true);
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
    for (const id of ['light-capital', 'dark-capital']) {
      const court = scenery.find((piece) => piece.id === `${id}-stronghold-court`);
      expect(court).toBeDefined();
      expect(
        Math.max(...(court?.shape.map((point) => point.x) ?? [])) -
          Math.min(...(court?.shape.map((point) => point.x) ?? [])),
      ).toBe(1760);
    }
    expect(map.interior?.width).toBe(1800);
    expect(map.interior?.height).toBe(2200);
    for (const room of [
      'library',
      'sacristy',
      'vestry',
      'reliquary',
      'west-cloister',
      'east-cloister',
    ])
      expect(map.interior?.scenery?.some((piece) => piece.id === `${room}-floor`)).toBe(true);
    expect(
      map.interior?.scenery?.filter((piece) => piece.id.startsWith('room-doorway-')),
    ).toHaveLength(8);
  });
  it('enlarges the battlefield uniformly and preserves all original feature anchors', () => {
    const map = new MapLayout().build(MAP_1);
    expect(map.width).toBe(12800);
    expect(map.height).toBe(7200);
    for (const original of MAP_1.features) {
      expect(map.features.find((feature) => feature.id === original.id)).toEqual({
        ...original,
        position: { x: original.position.x * MAP_1_SCALE, y: original.position.y * MAP_1_SCALE },
      });
    }
    expect(map.lanes.map((lane) => lane.id)).toEqual(MAP_1.lanes.map((lane) => lane.id));
    expect(map.lanes[0]?.path[0]).toEqual({ x: 680, y: 3600 });
  });

  it('creates repeatable scenery, twelve neutral camps and distinct capture landmarks', () => {
    const first = new MapLayout().build(MAP_1);
    const second = new MapLayout().build(MAP_1);
    expect(first).toEqual(second);
    expect(first.features.filter((feature) => feature.kind === 'camp')).toHaveLength(
      CAMP_POSITIONS.length,
    );
    expect(
      first.features
        .filter((feature) => feature.kind === 'camp')
        .every((feature) => feature.owner === 'neutral'),
    ).toBe(true);
    expect(
      first.scenery?.find((piece) => piece.id === 'north-crossing-fort-keep-roof')?.color,
    ).not.toBe(first.scenery?.find((piece) => piece.id === 'south-crossing-fort-keep-roof')?.color);
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

  it('provides an interior with pews, windows, columns, chapels and an entrance', () => {
    const interior = new MapLayout().build(MAP_1).interior;
    expect(interior?.id).toBe('grand-cathedral-interior');
    for (const prefix of [
      'pew-',
      'column-',
      'west-window-',
      'east-window-',
      'west-chapel',
      'entry-door',
    ]) {
      expect(interior?.scenery?.some((piece) => piece.id.startsWith(prefix))).toBe(true);
    }
    expect(
      interior?.scenery?.every((piece) =>
        piece.shape.every(
          (point) =>
            point.x >= 0 && point.y >= 0 && point.x <= interior.width && point.y <= interior.height,
        ),
      ),
    ).toBe(true);
  });
});
