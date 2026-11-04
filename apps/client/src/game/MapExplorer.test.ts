import { createDefaultGameConfig, MapGenerator } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { MapExplorer } from './MapExplorer';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';
const MAP_1 = new MapGenerator().generate(createDefaultGameConfig(), 1);

describe('MapExplorer', () => {
  it('takes over another view without moving or resizing it', () => {
    const explorer = new MapExplorer(MAP_1);
    const area = { x: 400, y: 300, width: 160, height: 90 };
    explorer.showArea(area, 16 / 9);
    expect(explorer.areaFor(16 / 9)).toEqual(area);
  });
  it('preserves the screen aspect ratio and clamps zoomed panning to the battlefield', () => {
    const explorer = new MapExplorer(MAP_1);
    expect(explorer.areaFor(16 / 9).width / explorer.areaFor(16 / 9).height).toBeCloseTo(16 / 9);
    explorer.zoomBy(4);
    explorer.pan(-100000, -100000, 16 / 9);
    expect(explorer.areaFor(16 / 9).x).toBe(0);
    expect(explorer.areaFor(16 / 9).y).toBe(0);
    explorer.lookAt({ x: MAP_1.width, y: MAP_1.height });
    const area = explorer.areaFor(16 / 9);
    expect(area.x + area.width).toBe(MAP_1.width);
    expect(area.y + area.height).toBe(MAP_1.height);
    explorer.zoomBy(1000);
    expect(explorer.areaFor(16 / 9).width).toBeCloseTo(MAP_1.width / EXPLORER_SETTINGS.maxZoom);
    explorer.zoomBy(0);
    expect(explorer.areaFor(16 / 9).width).toBe(MAP_1.width);
  });
  it('shows the whole battlefield again on overview', () => {
    const explorer = new MapExplorer(MAP_1);
    explorer.zoomBy(3);
    explorer.lookAt({ x: 100, y: 100 });
    explorer.overview();
    expect(explorer.areaFor(16 / 9).width).toBe(MAP_1.width);
  });
});
