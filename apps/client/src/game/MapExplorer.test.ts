import { createDefaultGameConfig, MapGenerator, MapLayout } from '@eternalus/core';
const MAP_1 = new MapLayout().build(new MapGenerator().generate(createDefaultGameConfig(), 1));
import { describe, expect, it } from 'vitest';
import { MapExplorer } from './MapExplorer';

describe('MapExplorer', () => {
  it('takes over another view without moving or resizing it', () => {
    const explorer = new MapExplorer(MAP_1);
    const area = { x: 400, y: 300, width: 160, height: 90 };
    explorer.showArea(area, 16 / 9);
    expect(explorer.areaFor(16 / 9)).toEqual(area);
  });
  it('toggles all building roofs independently without changing the map or camera', () => {
    const explorer = new MapExplorer(MAP_1);
    explorer.zoomBy(3);
    explorer.lookAt({ x: 4200, y: 3000 });
    const area = explorer.areaFor(16 / 9);
    for (const [id, x] of [
      ['light-stronghold', 130],
      ['cathedral-lane-1', 800],
      ['dark-stronghold', 1470],
    ] as const) {
      expect(explorer.toggleRoofAt({ x: x * 1, y: 450 * 1 })).toBe(true);
      expect(explorer.hiddenRoofs.has(id)).toBe(true);
      expect(explorer.currentMap).toBe(MAP_1);
      expect(explorer.areaFor(16 / 9)).toEqual(area);
    }
    expect(explorer.hiddenRoofs.size).toBe(3);
    expect(explorer.toggleRoofAt({ x: 800 * 1, y: 450 * 1 })).toBe(true);
    expect(explorer.hiddenRoofs.has('cathedral-lane-1')).toBe(false);
    expect(explorer.hiddenRoofs.has('light-stronghold')).toBe(true);
    explorer.overview();
    expect(explorer.hiddenRoofs.size).toBe(0);
    expect(explorer.areaFor(16 / 9).width).toBe(MAP_1.width);
  });
  it('accepts both cathedral doors and rejects points outside real building silhouettes', () => {
    const explorer = new MapExplorer(MAP_1);
    for (const point of [
      { x: 32, y: 325 },
      { x: 700, y: 350 },
      { x: 900, y: 550 },
      { x: 0, y: 0 },
    ])
      expect(explorer.toggleRoofAt({ x: point.x * 1, y: point.y * 1 })).toBe(false);
    expect(explorer.toggleRoofAt({ x: 800 * 1, y: 325 * 1 })).toBe(true);
    expect(explorer.toggleRoofAt({ x: 800 * 1, y: 545 * 1 })).toBe(true);
    expect(explorer.hiddenRoofs.size).toBe(0);
  });
  it('ignores roof toggles on a map without buildings', () => {
    const { buildings, ...map } = MAP_1;
    expect(buildings).toHaveLength(3);
    expect(new MapExplorer(map).toggleRoofAt({ x: 800, y: 450 })).toBe(false);
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
    expect(explorer.areaFor(16 / 9).width).toBeCloseTo(MAP_1.width / 32);
    explorer.zoomBy(0);
    expect(explorer.areaFor(16 / 9).width).toBe(MAP_1.width);
  });
});
