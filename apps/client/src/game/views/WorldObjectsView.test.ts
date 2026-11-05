import type { MapObject, MapObjectSnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { WorldObjectsView } from './WorldObjectsView';
import { OBJECT_DRAWING as S } from './WorldObjectsView.constants';
import { RUIN_PALETTE } from './ruinMaterials';
const HOUSE: MapObject = {
  id: 'house',
  kind: 'house',
  isBlocking: true,
  footprints: [
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
  ],
};
const STATE: MapObjectSnapshot = {
  id: 'house',
  entityId: 'entity-1',
  health: { current: 50, max: 100 },
  isDestroyed: false,
};
const AREA = { x: 0, y: 0, width: 32, height: 32 };
describe('WorldObjectsView', () => {
  it('renders a proportional health bar and replaces it with walkable ruin artwork after destruction', () => {
    const view = new WorldObjectsView([HOUSE]);
    const renderer = new RecordingRenderer();
    view.show([STATE]);
    view.draw(renderer, AREA);
    const fills = renderer.calls.filter((c) => c.op === 'fillPolygon');
    expect(fills).toHaveLength(2);
    expect(fills[1]?.args[1]).toBe(S.barHealth);
    expect(fills[1]?.args[0][1]?.x).toBe(5);
    renderer.calls.length = 0;
    view.show([{ ...STATE, isDestroyed: true, health: { current: 0, max: 100 } }]);
    view.draw(renderer, AREA);
    expect(view.isDestroyed('house')).toBe(true);
    expect(view.revision).toBe(1);
    const ruinColors = renderer.calls.flatMap((call) =>
      call.op === 'fillPolygon' ? [call.args[1]] : [],
    );
    expect(ruinColors).toContain(RUIN_PALETTE.flame);
    expect(ruinColors).toContain(RUIN_PALETTE.smoke);
    expect(ruinColors).not.toContain(S.barHealth);
    view.show([{ ...STATE, isDestroyed: true }]);
    expect(view.revision).toBe(1);
  });
  it('keeps a fallen log visible when its original trunk footprint is offscreen', () => {
    const tree = {
      ...HOUSE,
      kind: 'tree' as const,
      footprints: [
        [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 10 },
          { x: 0, y: 10 },
        ],
      ],
    };
    const view = new WorldObjectsView([tree]);
    const renderer = new RecordingRenderer();
    view.show([{ ...STATE, isDestroyed: true }]);
    view.draw(renderer, { x: 10, y: 0, width: 10, height: 10 });
    expect(
      renderer.calls.some(
        (call) => call.op === 'fillPolygon' && call.args[1] === RUIN_PALETTE.cutWood,
      ),
    ).toBe(true);
  });
  it('culls offscreen objects, hides interior bars under roofs and omits indestructible health bars', () => {
    const roofs = new Set<string>();
    const view = new WorldObjectsView(
      [{ ...HOUSE, isInterior: true, buildingId: 'palace' }],
      roofs,
    );
    const renderer = new RecordingRenderer();
    view.show([STATE]);
    view.draw(renderer, AREA);
    expect(renderer.calls).toEqual([]);
    roofs.add('palace');
    view.draw(renderer, { x: 100, y: 100, width: 32, height: 32 });
    expect(renderer.calls).toEqual([]);
    view.show([{ ...STATE, health: null }]);
    view.draw(renderer, AREA);
    expect(renderer.calls).toEqual([]);
    view.show([STATE]);
    view.draw(renderer, AREA);
    expect(renderer.calls).toHaveLength(2);
  });
});
