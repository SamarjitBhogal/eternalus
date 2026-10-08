import { MAP_1 } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { MapExplorer } from './MapExplorer';

describe('MapExplorer', () => {
  it('accepts the expanded cathedral wings and rejects points beyond the enlarged footprint', () => {
    const explorer = new MapExplorer(MAP_1);
    expect(explorer.enterAt({ x: 7210, y: 3600 })).toBe(false);
    expect(explorer.enterAt({ x: 6400, y: 4550 })).toBe(false);
    expect(explorer.enterAt({ x: 7130, y: 3600 })).toBe(true);
    explorer.overview();
    expect(explorer.enterAt({ x: 6400, y: 4400 })).toBe(true);
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

  it('enters only the cathedral, displays its interior and returns to the battlefield', () => {
    const explorer = new MapExplorer(MAP_1);
    expect(explorer.enterAt({ x: 0, y: 0 })).toBe(false);
    expect(explorer.enterAt({ x: 6400, y: 3600 })).toBe(true);
    expect(explorer.isInterior).toBe(true);
    expect(explorer.currentMap.id).toBe('grand-cathedral-interior');
    expect(explorer.areaFor(16 / 9).height).toBeCloseTo(2200 / 1.65);
    explorer.pan(0, 100000, 16 / 9);
    const interiorArea = explorer.areaFor(16 / 9);
    expect(interiorArea.y + interiorArea.height).toBe(2200);
    expect(explorer.enterAt({ x: 6400, y: 3600 })).toBe(false);
    explorer.overview();
    expect(explorer.isInterior).toBe(false);
    expect(explorer.currentMap).toBe(MAP_1);
    expect(explorer.areaFor(16 / 9).width).toBe(MAP_1.width);
  });

  it('ignores entry when a map has no authored interior', () => {
    const { interior: unusedInterior, ...exterior } = MAP_1;
    expect(unusedInterior).toBeDefined();
    expect(new MapExplorer(exterior).enterAt({ x: 6400, y: 3600 })).toBe(false);
  });
});
