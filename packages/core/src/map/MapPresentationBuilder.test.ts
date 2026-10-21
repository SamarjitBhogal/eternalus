import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { isPointInPolygon } from '../utils/geometry';
describe('MapPresentationBuilder', () => {
  it('keeps presentation separate from the generated contract and leaves shadows visible', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const before = structuredClone(map);
    const presentation = new MapPresentationBuilder().build(map);
    expect(map).toEqual(before);
    expect(Object.keys(presentation).sort()).toEqual(['buildings', 'scenery']);
    expect(presentation.buildings).toHaveLength(3);
    for (const feature of map.features.filter(
      (f) => f.kind === 'stronghold' || f.kind === 'cathedral',
    )) {
      const building = presentation.buildings.find((b) => b.id === feature.id);
      expect(building?.footprint.some((shape) => isPointInPolygon(feature.position, shape))).toBe(
        true,
      );
      expect(
        presentation.scenery.find(
          (p) =>
            p.id ===
            (feature.kind === 'cathedral' ? 'cathedral-shadow' : `${feature.id}-stronghold-shadow`),
        )?.visibility,
      ).toBeUndefined();
    }
  });
  it.each([
    [1600, 900],
    [2400, 1200],
  ])(
    'contains every piece at world size %s by %s without covering the generated ring',
    (width, height) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(
        { ...config, map: { ...config.map, worldWidth: width, worldHeight: height } },
        1,
      );
      const { scenery } = new MapPresentationBuilder().build(map);
      const ring = map.features.filter((f) => ['gate', 'wall-segment', 'turret'].includes(f.kind));
      expect(
        scenery.every((piece) =>
          piece.shape.every(
            (point) =>
              Number.isFinite(point.x) &&
              Number.isFinite(point.y) &&
              point.x >= 0 &&
              point.x <= width &&
              point.y >= 0 &&
              point.y <= height,
          ),
        ),
      ).toBe(true);
      for (const piece of scenery.filter((p) => p.layer === 'detail')) {
        const overlaps = ring.some(
          (feature) =>
            isPointInPolygon(feature.position, piece.shape) ||
            (feature.footprint ?? []).some((point) => isPointInPolygon(point, piece.shape)) ||
            piece.shape.some((point) => isPointInPolygon(point, feature.footprint ?? [])),
        );
        expect({ id: piece.id, overlaps }).toEqual({ id: piece.id, overlaps: false });
      }
    },
  );
});
