import { MAP_1 } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { Renderer } from '../engine/Renderer';
import type { DrawContext } from '../engine/Renderer.types';
import { MapView } from './MapView';
import { MiniMapView } from './MiniMapView';
import { MINI_MAP_BORDER_COLOR, MINI_MAP_VIEW_BOX_COLOR } from './MiniMapView.constants';
import { SceneView } from './SceneView';
import type { WorldLayer } from './SceneView.types';

/** A pretend camera view: the part of the map the main screen is showing, in map units. */
const VIEW = { x: 0, y: 200, width: 640, height: 360 };

/** A mini map whose scene is just the map, like in the real game today. */
const createMiniMap = (): MiniMapView => new MiniMapView(MAP_1, new MapView(MAP_1));

/** A pretend canvas. Tests run without a browser, so every drawing tool does nothing. */
const createFakeContext = (): DrawContext => ({
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

// All tests use a 1000 x 800 screen.
describe('MiniMapView', () => {
  it('sits in the bottom-right corner with the same shape as the map', () => {
    const area = createMiniMap().areaFor(1000, 800);

    // The margin is 1.5% of the screen width (15 px), so the right edge is at 1000 - 15
    // and the bottom edge is at 800 - 15.
    expect(area.x + area.width).toBeCloseTo(985);
    expect(area.y + area.height).toBeCloseTo(785);
    // Same width-to-height shape as the map, so the mini map isn't squashed.
    expect(area.width / area.height).toBeCloseTo(MAP_1.width / MAP_1.height);
  });

  it('draws the scene inside its area, then a border on top', () => {
    const renderer = new Renderer(createFakeContext());
    // Spies record each call so we can check what the mini map asked for.
    const fitWorldInArea = vi.spyOn(renderer, 'fitWorldInArea');
    const mapDraw = vi.spyOn(MapView.prototype, 'draw');
    const strokeScreenRect = vi.spyOn(renderer, 'strokeScreenRect');
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1000, 800, VIEW);

    const area = miniMap.areaFor(1000, 800);
    // 1. The whole map is shrunk to fit the mini map's box.
    expect(fitWorldInArea).toHaveBeenCalledWith(MAP_1.width, MAP_1.height, area);
    // 2. The map is drawn (through the scene).
    expect(mapDraw).toHaveBeenCalledWith(renderer);
    // 3. A border is drawn around the box.
    expect(strokeScreenRect).toHaveBeenCalledWith(area, MINI_MAP_BORDER_COLOR, 2);
  });

  it('keeps the whole map visible inside the mini map', () => {
    const renderer = new Renderer(createFakeContext());
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1000, 800, VIEW);
    const area = miniMap.areaFor(1000, 800);

    // The map's far corner must land exactly on the mini map's far corner: nothing cut off.
    const bottomRight = renderer.toScreen({ x: MAP_1.width, y: MAP_1.height });
    expect(bottomRight.x).toBeCloseTo(area.x + area.width);
    expect(bottomRight.y).toBeCloseTo(area.y + area.height);
  });

  it('outlines the part of the map the main view is showing', () => {
    const renderer = new Renderer(createFakeContext());
    const strokePath = vi.spyOn(renderer, 'strokePath');
    createMiniMap().draw(renderer, 1000, 800, VIEW);

    // Many lines are drawn (the lanes too), so find the one in the view-box colour.
    const viewBoxCall = strokePath.mock.calls.find((call) => call[1] === MINI_MAP_VIEW_BOX_COLOR);
    // It goes around the four corners of VIEW and back to the start to close the box.
    expect(viewBoxCall?.[0]).toEqual([
      { x: 0, y: 200 },
      { x: 640, y: 200 },
      { x: 640, y: 560 },
      { x: 0, y: 560 },
      { x: 0, y: 200 },
    ]);
  });

  it('shows layers added to the scene later with no change to the mini map', () => {
    const renderer = new Renderer(createFakeContext());
    // A fake "obstacles" layer, like one a teammate might add later.
    const drawObstacles = vi.fn();
    const obstacles: WorldLayer = { draw: drawObstacles };
    const scene = new SceneView([new MapView(MAP_1), obstacles]);
    new MiniMapView(MAP_1, scene).draw(renderer, 1000, 800, VIEW);

    // The mini map drew the obstacles too, without any change to MiniMapView.
    expect(drawObstacles).toHaveBeenCalledWith(renderer);
  });
});
