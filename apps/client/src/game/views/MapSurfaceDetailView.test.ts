import type { MapDecoration } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { MapSurfaceDetailView } from './MapSurfaceDetailView';
import { SceneryView } from './SceneryView';

const roof: MapDecoration = {
  id: 'palace-roof',
  color: '#536d70',
  layer: 'detail',
  shape: [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 0, y: 20 },
  ],
};
const area = { x: 2, y: 2, width: 8, height: 6 };

describe('MapSurfaceDetailView', () => {
  it('keeps repeatable fine material marks inside the real building silhouette', () => {
    const a = new RecordingRenderer();
    const b = new RecordingRenderer();
    const surface = new MapSurfaceDetailView();
    surface.draw(a, roof, area);
    surface.draw(b, roof, area);
    expect(a.calls).toEqual(b.calls);
    expect(a.calls.length).toBeGreaterThan(20);
    for (const call of a.calls) {
      expect(call.op).toBe('fillPolygon');
      if (call.op !== 'fillPolygon') continue;
      for (const point of call.args[0]) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.x + point.y).toBeLessThanOrEqual(20);
        expect(point.x).toBeLessThanOrEqual(area.x + area.width + 1);
        expect(point.y).toBeLessThanOrEqual(area.y + area.height + 1);
      }
    }
  });
  it('leaves overview, unknown surfaces and off-screen buildings free of fine detail', () => {
    const renderer = new RecordingRenderer();
    const surface = new MapSurfaceDetailView();
    surface.draw(renderer, roof, undefined);
    surface.draw(renderer, roof, { ...area, width: 1600 });
    surface.draw(renderer, roof, { ...area, x: 500 });
    surface.draw(renderer, { ...roof, id: 'lectern' }, area);
    surface.draw(renderer, { ...roof, id: 'roof-shadow' }, area);
    expect(renderer.calls).toEqual([]);
  });
  it('textures natural ground and water separately from roof courses', () => {
    const surface = new MapSurfaceDetailView();
    for (const id of ['surface-meadow', 'lake-water', 'palace-carpet']) {
      const renderer = new RecordingRenderer();
      surface.draw(renderer, { ...roof, id }, area);
      expect(renderer.calls.length).toBeGreaterThan(0);
      expect(
        renderer.calls.some((c) => c.op === 'fillPolygon' && c.args[1] === 'rgba(17,24,23,0.22)'),
      ).toBe(false);
    }
  });
  it('omits microdetail from the minimap and preserves roof visibility', () => {
    const renderer = new RecordingRenderer();
    const roofs = new Set<string>();
    const view = new SceneryView(
      [{ ...roof, buildingId: 'palace', visibility: 'roof' }],
      'detail',
      roofs,
      () => area,
    );
    view.draw(renderer);
    expect(renderer.calls.length).toBeGreaterThan(20);
    renderer.calls.length = 0;
    view.drawMinimap(renderer);
    expect(renderer.calls).toHaveLength(1);
    roofs.add('palace');
    renderer.calls.length = 0;
    view.draw(renderer);
    expect(renderer.calls).toHaveLength(0);
  });
});
