import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { SHIELD_STYLE as S } from '../content/maps/map1Scenery';
import { MapGenerator } from './MapGenerator';
import { MapShieldBuilder } from './MapShieldBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';
import { MapPresentationBuilder } from './MapPresentationBuilder';

describe('MapShieldBuilder', () => {
  it('dresses the actual collision arc with blue glass, bright seams and runes owned by each destructible feature', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const before = structuredClone(map);
    const art = new MapShieldBuilder().build(map.features);
    const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    for (const feature of map.features.filter((f) => f.kind === 'wall-segment')) {
      const pieces = art.filter((p) => p.replacesFeature === feature.id);
      expect(pieces.map((p) => p.color)).toEqual(
        expect.arrayContaining([S.glow, S.glass, S.core, S.edge]),
      );
      expect(pieces.every((p) => p.object?.id === feature.id && !p.object.isFootprint)).toBe(true);
      const glass = pieces.find((p) => p.color === S.glass);
      const physical = objects.find((o) => o.id === feature.id);
      expect(physical?.isBlocking).toBe(true);
      expect(glass?.shape).toHaveLength(feature.footprint?.length ?? 0);
      glass?.shape.forEach((p, i) => {
        expect(p.x).toBeCloseTo(physical?.footprints[0]?.[i]?.x ?? Number.NaN, 9);
        expect(p.y).toBeCloseTo(physical?.footprints[0]?.[i]?.y ?? Number.NaN, 9);
      });
    }
    const gates = map.features.filter((f) => f.kind === 'gate');
    for (const gate of gates) {
      expect(art.filter((p) => p.replacesFeature === gate.id).map((p) => p.color)).not.toContain(
        S.glass,
      );
      expect(objects.find((o) => o.id === gate.id)?.isBlocking).toBe(false);
    }
    expect(map).toEqual(before);
  });

  it('supports legacy quadrilateral panels and ignores unrelated or empty features', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const wall = map.features.find((f) => f.kind === 'wall-segment');
    if (wall === undefined) throw new Error('Missing wall');
    const art = new MapShieldBuilder().build([
      {
        ...wall,
        footprint: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 20 },
          { x: 0, y: 20 },
        ],
      },
      { ...wall, id: 'empty', footprint: [] },
    ]);
    expect(art.find((p) => p.id === `${wall.id}-glass`)?.shape).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 20 },
      { x: 10, y: 20 },
      { x: 10, y: 0 },
    ]);
    expect(
      art.every((p) => p.shape.every((v) => Number.isFinite(v.x) && Number.isFinite(v.y))),
    ).toBe(true);
    expect(
      new MapShieldBuilder().build(map.features.filter((f) => f.kind === 'cathedral')),
    ).toEqual([]);
  });
});
