import { describe, expect, it } from 'vitest';
import { MapRoadBuilder } from './MapRoadBuilder';
import { MAP_PALETTE as P, ROAD_STYLE as S } from '../content/maps/map1Scenery';
import { isPointInPolygon } from '../utils/geometry';

describe('MapRoadBuilder', () => {
  it('joins the road at the actual lane bend instead of drawing a rounded shortcut', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
    ];
    const before = structuredClone(path);
    const scenery = new MapRoadBuilder().build([{ id: 'lane', index: 0, path }]);
    const surface = scenery.find((p) => p.color === P.road);
    expect(surface?.shape).toEqual([
      { x: 0, y: S.surfaceWidth / 2 },
      { x: 20 - S.surfaceWidth / 2, y: S.surfaceWidth / 2 },
      { x: 20 - S.surfaceWidth / 2, y: 20 },
      { x: 20 + S.surfaceWidth / 2, y: 20 },
      { x: 20 + S.surfaceWidth / 2, y: -S.surfaceWidth / 2 },
      { x: 0, y: -S.surfaceWidth / 2 },
    ]);
    expect(isPointInPolygon({ x: 19.5, y: 0.5 }, surface?.shape ?? [])).toBe(true);
    expect(
      scenery.every(
        (p) => p.isLaneSurface === true && p.layer === 'ground' && p.object === undefined,
      ),
    ).toBe(true);
    expect(scenery.map((p) => p.color)).toEqual(
      expect.arrayContaining([P.laneVerge, P.roadShoulder, P.road, P.roadWear, P.roadPebble]),
    );
    expect(path).toEqual(before);
  });

  it('keeps empty and repeated-point paths finite', () => {
    const scenery = new MapRoadBuilder().build([
      { id: 'empty', index: 0, path: [] },
      {
        id: 'repeat',
        index: 1,
        path: [
          { x: 1, y: 1 },
          { x: 1, y: 1 },
          { x: 10, y: 1 },
        ],
      },
    ]);
    expect(scenery.some((p) => p.id.includes('empty'))).toBe(false);
    expect(
      scenery.every((p) => p.shape.every((v) => Number.isFinite(v.x) && Number.isFinite(v.y))),
    ).toBe(true);
  });
});
