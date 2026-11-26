import type { MapObject, MapObjectSnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { WorldObjectsView } from './WorldObjectsView';
import { OBJECT_DRAWING as S } from './WorldObjectsView.constants';
import { OBJECT_RUINS } from './ObjectRuinsView.constants';
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
    expect(view.isFallen('house')).toBe(true);
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
  it("draws a structure's ruined body (a dead turret's pylon) as ruins, though it still stands and blocks (DEC-341)", () => {
    const pylon: MapObject = { ...HOUSE, id: 'pylon', kind: 'turret' };
    const view = new WorldObjectsView([pylon]);
    const renderer = new RecordingRenderer();
    view.show([{ id: 'pylon', entityId: null, health: null, isDestroyed: false, isRuined: true }]);
    view.draw(renderer, AREA);
    view.drawMinimap(renderer);

    expect(view.isFallen('pylon')).toBe(true);
    expect(view.revision).toBe(1);
    expect(renderer.calls.filter((call) => call.op === 'fillPolygon').length).toBeGreaterThan(0);
  });
  it("draws a pylon's own bar under it and its turret's bar above it, each by its own health (DEC-375)", () => {
    const pylon: MapObject = { ...HOUSE, id: 'pylon', kind: 'turret' };
    const view = new WorldObjectsView([pylon]);
    const renderer = new RecordingRenderer();
    view.show([
      {
        id: 'pylon',
        entityId: 'entity-2',
        health: { current: 300, max: 600 },
        isDestroyed: false,
        carriedHealth: { current: 150, max: 600 },
      },
    ]);
    view.draw(renderer, AREA);
    const bars = renderer.calls.flatMap((call) =>
      call.op === 'fillPolygon' && call.args[1] === S.barHealth
        ? [{ y: call.args[0][0]?.y, width: (call.args[0][1]?.x ?? 0) - (call.args[0][0]?.x ?? 0) }]
        : [],
    );

    expect(bars).toEqual([
      { y: 10 + S.barGap, width: S.barWidth / 2 },
      { y: -S.barGap - S.barHeight, width: S.barWidth / 4 },
    ]);
  });
  it("keeps a ruined pylon's own bar with its ruin once its turret fell, and draws no bar for a destroyed one (DEC-375)", () => {
    const pylon: MapObject = { ...HOUSE, id: 'pylon', kind: 'turret' };
    const view = new WorldObjectsView([pylon]);
    const renderer = new RecordingRenderer();
    const ruin: MapObjectSnapshot = {
      id: 'pylon',
      entityId: 'entity-2',
      health: { current: 300, max: 600 },
      isDestroyed: false,
      isRuined: true,
    };
    const barFills = () =>
      renderer.calls.filter((call) => call.op === 'fillPolygon' && call.args[1] === S.barHealth);
    view.show([ruin]);
    view.draw(renderer, AREA);
    const ruinBars = barFills().length;
    renderer.calls.length = 0;
    view.show([{ ...ruin, isDestroyed: true, health: { current: 0, max: 600 } }]);
    view.draw(renderer, AREA);

    expect(ruinBars).toBe(1);
    expect(barFills()).toEqual([]);
    expect(renderer.calls.length).toBeGreaterThan(0);
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
  describe('a body with three footprint polygons', () => {
    const box = (x: number) => [
      { x, y: 0 },
      { x: x + 4, y: 0 },
      { x: x + 4, y: 4 },
      { x, y: 4 },
    ];
    const FORT: MapObject = {
      ...HOUSE,
      id: 'fort',
      kind: 'house',
      footprints: [box(0), box(10), box(20)],
    };
    const BOXES = [0, 10, 20];
    const WIDE = { x: 0, y: 0, width: 64, height: 64 };
    const ruinFills = (view: WorldObjectsView, flags: Partial<MapObjectSnapshot>) => {
      const renderer = new RecordingRenderer();
      view.show([{ id: 'fort', entityId: null, health: null, isDestroyed: false, ...flags }]);
      view.draw(renderer, WIDE);
      const draw = [...renderer.calls];
      renderer.calls.length = 0;
      view.drawMinimap(renderer);
      return { draw, minimap: [...renderer.calls] };
    };
    const polygons = (calls: readonly { op: string; args: readonly unknown[] }[]) =>
      calls.flatMap((call) =>
        call.op === 'fillPolygon'
          ? [{ points: call.args[0] as readonly { x: number }[], color: call.args[1] }]
          : [],
      );
    const colours = new Set<unknown>(OBJECT_RUINS.house.pieces.map(({ color }) => color));

    it('draws a ruined body as one ruin per piece, none in the court between', () => {
      const { draw, minimap } = ruinFills(new WorldObjectsView([FORT]), { isRuined: true });
      for (const calls of [draw, minimap]) {
        const drawn = polygons(calls);
        expect(drawn.length).toBe(OBJECT_RUINS.house.pieces.length * BOXES.length);
        expect(drawn.every(({ color }) => colours.has(color))).toBe(true);
        for (const { points } of drawn)
          expect(BOXES.some((x) => points.every((p) => p.x >= x && p.x <= x + 4))).toBe(true);
        for (const x of BOXES)
          expect(drawn.some(({ points }) => points.every((p) => p.x >= x && p.x <= x + 4))).toBe(
            true,
          );
      }
    });

    it('still draws a destroyed body as one ruin over the whole box', () => {
      const { draw, minimap } = ruinFills(new WorldObjectsView([FORT]), { isDestroyed: true });
      for (const calls of [draw, minimap]) {
        const drawn = polygons(calls);
        expect(drawn.length).toBe(OBJECT_RUINS.house.pieces.length);
        expect(drawn.some(({ points }) => points.some((p) => p.x > 4 && p.x < 20))).toBe(true);
      }
    });

    it('keeps a ruined body visible when only its last piece is in view', () => {
      const view = new WorldObjectsView([FORT]);
      const renderer = new RecordingRenderer();
      view.show([{ id: 'fort', entityId: null, health: null, isDestroyed: false, isRuined: true }]);
      view.draw(renderer, { x: 21, y: 0, width: 8, height: 8 });
      expect(polygons(renderer.calls).length).toBeGreaterThan(0);
    });
  });
});
