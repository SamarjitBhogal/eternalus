import { MAP_1 } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';
import { Renderer } from '../engine/Renderer';
import type { DrawContext } from '../engine/Renderer.types';
import { SceneryView } from './SceneryView';
import { SceneView } from './SceneView';
import { MiniMapView } from './MiniMapView';

const context = (): DrawContext => ({
  beginPath: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineJoin: 'miter',
});
describe('SceneryView roof cutaways', () => {
  it('swaps only the selected building roof for its interior and restores it on a second click', () => {
    const renderer = new Renderer(context());
    const fill = vi.spyOn(renderer, 'fillPolygon');
    const roofs = new Set<string>();
    const view = new SceneryView(MAP_1, 'detail', roofs);
    const roof = MAP_1.scenery?.find((p) => p.id === 'cathedral-nave-roof');
    const interior = MAP_1.scenery?.find((p) => p.id === 'cathedral-interior-nave-floor');
    const palace = MAP_1.scenery?.find((p) => p.id === 'light-capital-palace-roof');
    const wall = MAP_1.scenery?.find((p) => p.id === 'light-capital-stronghold-wall');
    const buttress = MAP_1.scenery?.find((p) => p.id === 'cathedral-buttress-746-0');
    expect(wall).toBeDefined();
    expect(buttress).toBeDefined();
    expect(roof).toBeDefined();
    expect(interior).toBeDefined();
    expect(palace).toBeDefined();
    view.draw(renderer);
    expect(fill).toHaveBeenCalledWith(wall?.shape, wall?.color);
    expect(fill).toHaveBeenCalledWith(buttress?.shape, buttress?.color);
    expect(fill).toHaveBeenCalledWith(roof?.shape, roof?.color);
    expect(fill).not.toHaveBeenCalledWith(interior?.shape, interior?.color);
    fill.mockClear();
    roofs.add('grand-cathedral');
    view.draw(renderer);
    expect(fill).not.toHaveBeenCalledWith(roof?.shape, roof?.color);
    expect(fill).toHaveBeenCalledWith(interior?.shape, interior?.color);
    expect(fill).toHaveBeenCalledWith(palace?.shape, palace?.color);
    expect(fill).toHaveBeenCalledWith(wall?.shape, wall?.color);
    expect(fill).toHaveBeenCalledWith(buttress?.shape, buttress?.color);
    fill.mockClear();
    roofs.clear();
    view.draw(renderer);
    expect(fill).toHaveBeenCalledWith(roof?.shape, roof?.color);
    expect(fill).not.toHaveBeenCalledWith(interior?.shape, interior?.color);
  });
  it('shares roof visibility with the minimap', () => {
    const renderer = new Renderer(context());
    const fill = vi.spyOn(renderer, 'fillPolygon');
    const scene = new SceneView([new SceneryView(MAP_1, 'detail', new Set(['light-capital']))]);
    new MiniMapView(MAP_1, scene).draw(renderer, 1600, 900, {
      x: 0,
      y: 0,
      width: MAP_1.width,
      height: MAP_1.height,
    });
    const throne = MAP_1.scenery?.find((p) => p.id === 'light-palace-interior-throne-back');
    const roof = MAP_1.scenery?.find((p) => p.id === 'light-capital-palace-roof');
    expect(throne).toBeDefined();
    expect(roof).toBeDefined();
    expect(fill).toHaveBeenCalledWith(throne?.shape, throne?.color);
    expect(fill).not.toHaveBeenCalledWith(roof?.shape, roof?.color);
  });
});
