import { createDefaultGameConfig, MapGenerator, MapPresentationBuilder } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { SceneryView } from './SceneryView';
import { SceneView } from './SceneView';
import { MiniMapView } from './MiniMapView';
const MAP_1 = new MapGenerator().generate(createDefaultGameConfig(), 1);
const PRESENTATION = new MapPresentationBuilder().build(MAP_1);

describe('SceneryView roof cutaways', () => {
  it('swaps only the selected building roof for its interior and restores it on a second click', () => {
    const renderer = new RecordingRenderer();
    const fill = vi.spyOn(renderer, 'fillPolygon');
    const roofs = new Set<string>();
    const view = new SceneView([
      new SceneryView(PRESENTATION.scenery, 'ground', roofs),
      new SceneryView(PRESENTATION.scenery, 'detail', roofs),
    ]);
    const roof = PRESENTATION.scenery.find((p) => p.id === 'cathedral-nave-roof');
    const interior = PRESENTATION.scenery.find((p) => p.id === 'cathedral-interior-nave-floor');
    const palace = PRESENTATION.scenery.find((p) => p.id === 'light-stronghold-palace-roof');
    const wall = PRESENTATION.scenery.find((p) => p.id === 'light-stronghold-stronghold-wall');
    const buttress = PRESENTATION.scenery.find((p) => p.id === 'cathedral-buttress-746-0');
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
    roofs.add('cathedral-lane-1');
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
    const renderer = new RecordingRenderer();
    const fill = vi.spyOn(renderer, 'fillPolygon');
    const scene = new SceneView([
      new SceneryView(PRESENTATION.scenery, 'detail', new Set(['light-stronghold'])),
    ]);
    new MiniMapView(MAP_1, scene).draw(renderer, 1600, 900, {
      x: 0,
      y: 0,
      width: MAP_1.width,
      height: MAP_1.height,
    });
    const throne = PRESENTATION.scenery.find((p) => p.id === 'light-palace-interior-throne-back');
    const roof = PRESENTATION.scenery.find((p) => p.id === 'light-stronghold-palace-roof');
    expect(throne).toBeDefined();
    expect(roof).toBeDefined();
    expect(fill).toHaveBeenCalledWith(throne?.shape, throne?.color);
    expect(fill).not.toHaveBeenCalledWith(roof?.shape, roof?.color);
  });
});
