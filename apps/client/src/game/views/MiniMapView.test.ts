import { DEFAULT_MAP_CONFIG, type MapConfig, MapGenerator } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { Canvas2dRenderer } from '../engine/render/Canvas2dRenderer';
import type { Renderer } from '../engine/render/Renderer';
import type { DrawContext } from '../engine/render/Renderer.types';
import { MapView } from './MapView';
import { MiniMapView } from './MiniMapView';
import { MINI_MAP_BORDER_COLOR, MINI_MAP_VIEW_BOX_COLOR } from './MiniMapView.constants';
import { SceneView } from './SceneView';
import type { WorldLayer } from './SceneView.types';

/** The default generated map, the same one the game draws. */
const MAP = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, 1);

/** A pretend camera view: the part of the map the main screen is showing, in map units. */
const VIEW = { x: 0, y: 200, width: 640, height: 360 };

/** A fake renderer that records every call; views only ever see the `Renderer` port. */
const createRecordingRenderer = () =>
  ({
    resize: vi.fn<Renderer['resize']>(),
    fitWorld: vi.fn<Renderer['fitWorld']>(),
    fitWorldInArea: vi.fn<Renderer['fitWorldInArea']>(),
    showWorldArea: vi.fn<Renderer['showWorldArea']>(),
    clear: vi.fn<Renderer['clear']>(),
    fillScreenRect: vi.fn<Renderer['fillScreenRect']>(),
    strokeScreenRect: vi.fn<Renderer['strokeScreenRect']>(),
    fillPolygon: vi.fn<Renderer['fillPolygon']>(),
    strokePath: vi.fn<Renderer['strokePath']>(),
    drawWorldGlyph: vi.fn<Renderer['drawWorldGlyph']>(),
    drawGlyph: vi.fn<Renderer['drawGlyph']>(),
    toScreen: vi.fn<Renderer['toScreen']>((point) => point),
    destroy: vi.fn<Renderer['destroy']>(),
  }) satisfies Renderer;

/** A mini map whose scene is just the map, like in the real game today. */
const createMiniMap = (): MiniMapView => new MiniMapView(MAP, new MapView(MAP));

/** A pretend canvas. Tests run without a browser, so every drawing tool does nothing. */
const createFakeContext = (): DrawContext => ({
  beginPath: vi.fn(),
  closePath: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  rect: vi.fn(),
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
    expect(area.width / area.height).toBeCloseTo(MAP.width / MAP.height);
  });

  it('draws the scene inside its area, then a border on top', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
    // Spies record each call so we can check what the mini map asked for.
    const fitWorldInArea = vi.spyOn(renderer, 'fitWorldInArea');
    const mapDraw = vi.spyOn(MapView.prototype, 'drawMinimap');
    const strokeScreenRect = vi.spyOn(renderer, 'strokeScreenRect');
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1000, 800, VIEW);

    const area = miniMap.areaFor(1000, 800);
    // 1. The whole map is shrunk to fit the mini map's box.
    expect(fitWorldInArea).toHaveBeenCalledWith(MAP.width, MAP.height, area);
    // 2. The map is drawn as minimap markers (through the scene).
    expect(mapDraw).toHaveBeenCalledWith(renderer);
    // 3. A border is drawn around the box.
    expect(strokeScreenRect).toHaveBeenCalledWith(area, MINI_MAP_BORDER_COLOR, 2);
  });

  it('keeps the whole map visible inside the mini map', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1000, 800, VIEW);
    const area = miniMap.areaFor(1000, 800);

    // The map's far corner must land exactly on the mini map's far corner: nothing cut off.
    const bottomRight = renderer.toScreen({ x: MAP.width, y: MAP.height });
    expect(bottomRight.x).toBeCloseTo(area.x + area.width);
    expect(bottomRight.y).toBeCloseTo(area.y + area.height);
  });

  it('outlines the part of the map the main view is showing', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
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
    const renderer = new Canvas2dRenderer(createFakeContext());
    // A fake "obstacles" layer, like one a teammate might add later.
    const drawObstacles = vi.fn();
    const obstacles: WorldLayer = { draw: vi.fn(), drawMinimap: drawObstacles };
    const scene = new SceneView([new MapView(MAP), obstacles]);
    new MiniMapView(MAP, scene).draw(renderer, 1000, 800, VIEW);

    // The mini map drew the obstacles too, without any change to MiniMapView.
    expect(drawObstacles).toHaveBeenCalledWith(renderer);
  });

  it('turns a click on the mini map into the map position under it', () => {
    const miniMap = createMiniMap();
    const area = miniMap.areaFor(1000, 800);

    // Clicking the exact centre of the mini map points at the centre of the map.
    const point = miniMap.worldPointAt(
      area.x + area.width / 2,
      area.y + area.height / 2,
      1000,
      800,
    );

    expect(point?.x).toBeCloseTo(MAP.width / 2);
    expect(point?.y).toBeCloseTo(MAP.height / 2);
  });

  it('ignores clicks outside the mini map', () => {
    // The top-left corner of the screen is far from the mini map.
    expect(createMiniMap().worldPointAt(10, 10, 1000, 800)).toBeNull();
  });

  it('shows new map features with no view code change (ADR 0009 minimap proof)', () => {
    // Draw the mini map of a generated map and keep only the marker calls.
    const glyphCalls = (map: MapConfig) => {
      const generated = new MapGenerator().generate({ map }, 1);
      const renderer = createRecordingRenderer();
      new MiniMapView(generated, new SceneView([new MapView(generated)])).draw(
        renderer,
        1000,
        800,
        VIEW,
      );
      return { generated, calls: renderer.drawGlyph.mock.calls };
    };
    const base = glyphCalls(DEFAULT_MAP_CONFIG);
    // Only config changes: one more BuffTower per lane and two more lanes.
    const more = glyphCalls({ ...DEFAULT_MAP_CONFIG, numLanes: 5, buffTowersPerLane: 2 });

    // Every generated feature appears once on the mini map, with its own glyph and position.
    expect(more.calls).toHaveLength(more.generated.features.length);
    expect(more.calls.length).toBeGreaterThan(base.calls.length);
    const buffTowers = more.calls.filter((call) =>
      more.generated.features.some(
        (feature) => feature.kind === 'buff-tower' && feature.position === call[1],
      ),
    );
    // 5 lanes x 2 BuffTowers x 2 teams.
    expect(buffTowers).toHaveLength(20);
  });
});
