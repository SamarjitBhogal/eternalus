import {
  DEFAULT_MAP_CONFIG,
  type MapDefinition,
  type MapFeature,
  MapGenerator,
  MapSceneryBuilder,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { Canvas2dRenderer } from '../engine/render/Canvas2dRenderer';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { DrawContext } from '../engine/render/Canvas2dRenderer.types';
import { MapView } from './MapView';
import { MiniMapView } from './MiniMapView';
import { MINI_MAP_BORDER_COLOR, MINI_MAP_VIEW_BOX_COLOR } from './MiniMapView.constants';
import { SceneryView } from './SceneryView';
import { SceneView } from './SceneView';
import type { WorldLayer } from './SceneView.types';

/** The default generated map, the same one the game draws. */
const MAP = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, 1);

/** A pretend camera view: the part of the map the main screen is showing, in map units. */
const VIEW = { x: 0, y: 200, width: 640, height: 360 };

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
    const minimapGlyphs = (map: MapDefinition) => {
      const renderer = new RecordingRenderer();
      new MiniMapView(map, new SceneView([new MapView(map)])).draw(renderer, 1000, 800, VIEW);
      return renderer.calls.flatMap((call) => (call.op === 'drawGlyph' ? [call.args] : []));
    };
    const base = minimapGlyphs(MAP);
    // Only config changes: two more lanes and one more BuffTower per lane.
    const more = new MapGenerator().generate(
      { map: { ...DEFAULT_MAP_CONFIG, numLanes: 5, buffTowersPerLane: 2 } },
      1,
    );
    const moreGlyphs = minimapGlyphs(more);

    // Every generated feature appears once on the mini map, at its own position.
    expect(moreGlyphs).toHaveLength(more.features.length);
    expect(moreGlyphs.length).toBeGreaterThan(base.length);
    const buffTowers = more.features.filter((feature) => feature.kind === 'buff-tower');
    // 5 lanes x 2 BuffTowers x 2 teams, each drawn where it stands.
    expect(buffTowers).toHaveLength(20);
    for (const tower of buffTowers) {
      expect(moreGlyphs).toContainEqual([tower.minimapGlyph, tower.position, expect.any(String)]);
    }
  });

  it('draws a definition no client code has ever seen, with its own glyph', () => {
    // A brand-new content definition: a "beacon" with a glyph unlike any other.
    const beacon: MapFeature = {
      id: 'west-beacon-0',
      kind: 'obstacle',
      team: 'neutral',
      definitionId: 'beacon',
      position: { x: 400, y: 450 },
      minimapGlyph: { shape: 'diamond', size: 11, colourRole: 'terrain' },
    };
    const withBeacon: MapDefinition = { ...MAP, features: [...MAP.features, beacon] };
    const renderer = new RecordingRenderer();
    new MiniMapView(withBeacon, new SceneView([new MapView(withBeacon)])).draw(
      renderer,
      1000,
      800,
      VIEW,
    );
    const glyphs = renderer.calls.flatMap((call) => (call.op === 'drawGlyph' ? [call.args] : []));

    expect(glyphs).toContainEqual([beacon.minimapGlyph, beacon.position, expect.any(String)]);
  });
});

describe('MiniMapView with scenery', () => {
  it('clamps a viewport outline that reaches past the map to the map bounds', () => {
    const renderer = new RecordingRenderer();
    createMiniMap().draw(renderer, 1000, 800, {
      x: -100,
      y: -200,
      width: MAP.width + 200,
      height: MAP.height + 400,
    });
    const outline = renderer.calls.find(
      (call) => call.op === 'strokePath' && call.args[1] === MINI_MAP_VIEW_BOX_COLOR,
    );

    expect(outline?.args[0]).toEqual([
      { x: 0, y: 0 },
      { x: MAP.width, y: 0 },
      { x: MAP.width, y: MAP.height },
      { x: 0, y: MAP.height },
      { x: 0, y: 0 },
    ]);
  });

  it('draws the cathedral architecture through the same scenery layer on the minimap', () => {
    const scenery = new MapSceneryBuilder(MAP).build();
    const renderer = new RecordingRenderer();
    const scene = new SceneView([new MapView(MAP, scenery), new SceneryView(scenery, 'detail')]);
    new MiniMapView(MAP, scene).draw(renderer, 1000, 800, VIEW);
    const roof = scenery.find((piece) => piece.id === 'cathedral-nave-roof');

    expect(roof).toBeDefined();
    expect(renderer.calls).toContainEqual({ op: 'fillPolygon', args: [roof?.shape, roof?.color] });
  });
});
