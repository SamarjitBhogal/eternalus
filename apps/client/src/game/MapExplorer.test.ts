import { MAP_1 } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { MapExplorer } from './MapExplorer';

describe('MapExplorer', () => {
  it('toggles all building roofs independently without changing the map or camera', () => {
    const explorer = new MapExplorer(MAP_1);
    explorer.zoomBy(3);
    explorer.lookAt({ x: 4200, y: 3000 });
    const area = explorer.areaFor(16 / 9);
    for (const [id, x] of [
      ['light-capital', 142],
      ['grand-cathedral', 800],
      ['dark-capital', 1458],
    ] as const) {
      expect(explorer.toggleRoofAt({ x: x * 8, y: 450 * 8 })).toBe(true);
      expect(explorer.hiddenRoofs.has(id)).toBe(true);
      expect(explorer.currentMap).toBe(MAP_1);
      expect(explorer.areaFor(16 / 9)).toEqual(area);
    }
    expect(explorer.hiddenRoofs.size).toBe(3);
    expect(explorer.toggleRoofAt({ x: 800 * 8, y: 450 * 8 })).toBe(true);
    expect(explorer.hiddenRoofs.has('grand-cathedral')).toBe(false);
    expect(explorer.hiddenRoofs.has('light-capital')).toBe(true);
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
      expect(explorer.toggleRoofAt({ x: point.x * 8, y: point.y * 8 })).toBe(false);
    expect(explorer.toggleRoofAt({ x: 800 * 8, y: 325 * 8 })).toBe(true);
    expect(explorer.toggleRoofAt({ x: 800 * 8, y: 545 * 8 })).toBe(true);
    expect(explorer.hiddenRoofs.size).toBe(0);
  });
  it('ignores roof toggles on a map without buildings', () => {
    const { buildings, ...map } = MAP_1;
    expect(buildings).toHaveLength(3);
    expect(new MapExplorer(map).toggleRoofAt({ x: 6400, y: 3600 })).toBe(false);
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
    expect(explorer.areaFor(16 / 9).width).toBeCloseTo(MAP_1.width / 12);
    explorer.zoomBy(0);
    expect(explorer.areaFor(16 / 9).width).toBe(MAP_1.width);
  });
});
