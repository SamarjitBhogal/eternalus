import { CathedralInteriorBuilder, createDefaultGameConfig, MapGenerator } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { MapExplorer } from './MapExplorer';
import { EXPLORER_SETTINGS } from './MapExplorer.constants';

const MAP = new MapGenerator().generate(createDefaultGameConfig(), 1);
const INTERIOR = new CathedralInteriorBuilder().build(MAP);
const ENTRY = INTERIOR?.entry ?? { center: { x: 0, y: 0 }, halfWidth: 0, halfHeight: 0 };
const ASPECT = 16 / 9;

describe('MapExplorer', () => {
  it('accepts the cathedral footprint and rejects points just beyond it', () => {
    const explorer = new MapExplorer(MAP, INTERIOR);
    const { center, halfWidth, halfHeight } = ENTRY;

    expect(explorer.enterAt({ x: center.x + halfWidth + 1, y: center.y })).toBe(false);
    expect(explorer.enterAt({ x: center.x, y: center.y + halfHeight + 1 })).toBe(false);
    expect(explorer.enterAt({ x: center.x + halfWidth - 1, y: center.y })).toBe(true);
    explorer.overview();
    expect(explorer.enterAt({ x: center.x, y: center.y + halfHeight - 1 })).toBe(true);
  });

  it('preserves the screen aspect ratio and clamps zoomed panning to the battlefield', () => {
    const explorer = new MapExplorer(MAP, INTERIOR);
    expect(explorer.areaFor(ASPECT).width / explorer.areaFor(ASPECT).height).toBeCloseTo(ASPECT);
    explorer.zoomBy(4);
    explorer.pan(-100000, -100000, ASPECT);
    expect(explorer.areaFor(ASPECT).x).toBe(0);
    expect(explorer.areaFor(ASPECT).y).toBe(0);
    explorer.lookAt({ x: MAP.width, y: MAP.height });
    const area = explorer.areaFor(ASPECT);
    expect(area.x + area.width).toBe(MAP.width);
    expect(area.y + area.height).toBe(MAP.height);
    explorer.zoomBy(1000);
    expect(explorer.areaFor(ASPECT).width).toBeCloseTo(MAP.width / EXPLORER_SETTINGS.maxZoom);
    explorer.zoomBy(0);
    expect(explorer.areaFor(ASPECT).width).toBe(MAP.width);
  });

  it('takes over another view without moving or resizing it', () => {
    const explorer = new MapExplorer(MAP, INTERIOR);
    const area = { x: 400, y: 300, width: 160, height: 90 };

    explorer.showArea(area, ASPECT);

    expect(explorer.areaFor(ASPECT).x).toBeCloseTo(area.x);
    expect(explorer.areaFor(ASPECT).y).toBeCloseTo(area.y);
    expect(explorer.areaFor(ASPECT).width).toBeCloseTo(area.width);
  });

  it('enters only the cathedral, displays its interior and returns to the battlefield', () => {
    const explorer = new MapExplorer(MAP, INTERIOR);
    expect(explorer.enterAt({ x: 0, y: 0 })).toBe(false);
    expect(explorer.enterAt(ENTRY.center)).toBe(true);
    expect(explorer.isInterior).toBe(true);
    expect(explorer.currentMap.id).toBe('grand-cathedral-interior');
    expect(explorer.areaFor(ASPECT).height).toBeCloseTo(2200 / EXPLORER_SETTINGS.interiorZoom);
    explorer.pan(0, 100000, ASPECT);
    const interiorArea = explorer.areaFor(ASPECT);
    expect(interiorArea.y + interiorArea.height).toBe(2200);
    expect(explorer.enterAt(ENTRY.center)).toBe(false);
    explorer.overview();
    expect(explorer.isInterior).toBe(false);
    expect(explorer.currentMap).toBe(MAP);
    expect(explorer.areaFor(ASPECT).width).toBe(MAP.width);
  });

  it('ignores entry when the map has no interior', () => {
    expect(new MapExplorer(MAP, null).enterAt(ENTRY.center)).toBe(false);
  });
});
