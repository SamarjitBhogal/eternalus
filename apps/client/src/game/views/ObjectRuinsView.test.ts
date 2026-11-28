import { describe, expect, it } from 'vitest';
import type { MapObjectKind } from '@eternalus/core';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { ObjectRuinsView } from './ObjectRuinsView';
import { OBJECT_RUINS } from './ObjectRuinsView.constants';
import { RUIN_PALETTE as P } from './ruinMaterials';

const bounds = { x: 10, y: 20, width: 3, height: 10 };
const draw = (kind: MapObjectKind) => {
  const renderer = new RecordingRenderer();
  new ObjectRuinsView(kind, bounds).draw(renderer);
  return renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args] : []));
};

describe('ObjectRuinsView', () => {
  it('leaves a cut stump and a separate fallen trunk, masonry and embers for houses, and scattered rock shards', () => {
    const tree = draw('tree');
    const house = draw('house');
    const rock = draw('rock');
    expect(tree.some(([shape, color]) => color === P.cutWood && shape.every((p) => p.x < 14))).toBe(
      true,
    );
    expect(tree.some(([shape, color]) => color === P.bark && shape.some((p) => p.x > 20))).toBe(
      true,
    );
    expect(house.map(([, color]) => color)).toEqual(
      expect.arrayContaining([P.plaster, P.tile, P.char, P.flame, P.smoke]),
    );
    const shards = rock.filter(([, color]) => color === P.stone || color === P.stoneDark);
    expect(shards.length).toBeGreaterThanOrEqual(5);
    expect(shards.some(([shape]) => shape.every((p) => p.x < 11.5))).toBe(true);
    expect(shards.some(([shape]) => shape.every((p) => p.x > 11.5))).toBe(true);
    expect(rock.map(([, color]) => color)).not.toContain(P.flame);
    expect(tree).not.toEqual(rock);
  });

  it.each(Object.keys(OBJECT_RUINS) as MapObjectKind[])(
    'caches finite %s polygons and draws them identically on subsequent frames',
    (kind) => {
      const original = structuredClone(bounds);
      const view = new ObjectRuinsView(kind, bounds);
      const renderer = new RecordingRenderer();
      view.draw(renderer);
      const first = [...renderer.calls];
      renderer.calls.length = 0;
      view.draw(renderer);
      expect(renderer.calls).toEqual(first);
      expect(renderer.calls[0]).toBeDefined();
      expect(
        renderer.calls.every(
          (call) =>
            call.op === 'fillPolygon' &&
            call.args[0].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
        ),
      ).toBe(true);
      expect(bounds).toEqual(original);
    },
  );
});
