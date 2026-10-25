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
import type { ScreenRect } from '../engine/render/Renderer.types';
import { MapView } from './MapView';
import { MiniMapView } from './MiniMapView';
import { MINI_MAP_BACKGROUND_COLOR, MINI_MAP_VIEW_BOX_COLOR } from './MiniMapView.constants';
import type { MiniMapRing } from './MiniMapView.types';
import { SceneryView } from './SceneryView';
import { SceneView } from './SceneView';
import type { WorldLayer } from './SceneView.types';

/** The default generated map, the same one the game draws. */
const MAP = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, 1);

/** A pretend camera view: the part of the map the main screen is showing, in map units. */
const VIEW = { x: 0, y: 200, width: 640, height: 360 };

/**
 * The HUD ring as `Match` injects it (Figma 65:743: 255 × 244 at 1636, 47 in the 1920 × 1080
 * frame, 4 px stroke). Written out here because views import nothing from `bridge/` (01 §2).
 */
const RING: MiniMapRing = {
  frame: { width: 1920, height: 1080 },
  box: { right: 29, top: 47, width: 255, height: 244 },
  strokeWidth: 4,
};

/** A mini map whose scene is just the map, like in the real game today. */
const createMiniMap = (ring: MiniMapRing = RING): MiniMapView =>
  new MiniMapView(MAP, new MapView(MAP), ring);

/** A pretend canvas. Tests run without a browser, so every drawing tool does nothing. */
const createFakeContext = (): DrawContext => ({
  beginPath: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  rect: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineJoin: 'miter',
});

/** Where a point lies against the ellipse filling `area`: 1 on it, below 1 inside. */
const ellipseDistance = (x: number, y: number, area: ScreenRect, inset = 0): number => {
  const radiusX = area.width / 2 - inset;
  const radiusY = area.height / 2 - inset;
  return (
    ((x - area.x - area.width / 2) / radiusX) ** 2 + ((y - area.y - area.height / 2) / radiusY) ** 2
  );
};

// Unless a test says otherwise, the screen is the 1920 × 1080 design frame.
describe('MiniMapView', () => {
  it('sits in the HUD ring: (1636, 47, 255, 244) on a 1920 × 1080 screen', () => {
    expect(createMiniMap().areaFor(1920, 1080)).toEqual({
      x: 1636,
      y: 47,
      width: 255,
      height: 244,
    });
  });

  it('scales the ring by the smaller screen ratio and keeps it at the top-right corner', () => {
    // 3840 × 2160 is twice the frame both ways.
    expect(createMiniMap().areaFor(3840, 2160)).toEqual({
      x: 3272,
      y: 94,
      width: 510,
      height: 488,
    });
    // 1000 × 800 is limited by its width: 1000 / 1920 of the frame.
    const scale = 1000 / 1920;
    const area = createMiniMap().areaFor(1000, 800);
    expect(area.x).toBeCloseTo(1000 - (29 + 255) * scale);
    expect(area.y).toBeCloseTo(47 * scale);
    expect(area.width).toBeCloseTo(255 * scale);
    expect(area.height).toBeCloseTo(244 * scale);
  });

  it('fits the whole map, with its own shape, inside the ring stroke', () => {
    const miniMap = createMiniMap();
    const area = miniMap.areaFor(1920, 1080);
    const mapArea = miniMap.mapAreaFor(1920, 1080);

    expect(mapArea.width / mapArea.height).toBeCloseTo(MAP.width / MAP.height);
    // Centred in the ring, with its corners on the ellipse inside the 4 px stroke.
    expect(mapArea.x + mapArea.width / 2).toBeCloseTo(1763.5);
    expect(mapArea.y + mapArea.height / 2).toBeCloseTo(169);
    for (const [x, y] of [
      [mapArea.x, mapArea.y],
      [mapArea.x + mapArea.width, mapArea.y + mapArea.height],
    ] as const) {
      expect(ellipseDistance(x, y, area, RING.strokeWidth)).toBeCloseTo(1);
    }
  });

  it('draws everything inside the clip to the ring ellipse, and no border', () => {
    const renderer = new RecordingRenderer();
    const mapDraw = vi.spyOn(MapView.prototype, 'drawMinimap');
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1920, 1080, VIEW);
    const area = miniMap.areaFor(1920, 1080);

    // RecordingRenderer runs the clipped drawing at once, so it is recorded after the clip.
    expect(renderer.calls[0]).toEqual({ op: 'clipToEllipse', args: [area, expect.any(Function)] });
    expect(renderer.calls[1]).toEqual({
      op: 'fillScreenRect',
      args: [area, MINI_MAP_BACKGROUND_COLOR],
    });
    expect(renderer.calls[2]).toEqual({
      op: 'fitWorldInArea',
      args: [MAP.width, MAP.height, miniMap.mapAreaFor(1920, 1080)],
    });
    expect(mapDraw).toHaveBeenCalledWith(renderer);
    expect(renderer.calls.map((call) => call.op)).not.toContain('strokeScreenRect');

    // With a clip that never runs its drawing, nothing at all reaches the screen.
    const held = new RecordingRenderer();
    vi.spyOn(held, 'clipToEllipse').mockImplementation(() => undefined);
    miniMap.draw(held, 1920, 1080, VIEW);
    expect(held.calls).toEqual([]);
  });

  it('clips and fits to whichever ring it is given', () => {
    const other: MiniMapRing = {
      frame: { width: 1920, height: 1080 },
      box: { right: 100, top: 200, width: 300, height: 150 },
      strokeWidth: 10,
    };
    const clipOf = (ring: MiniMapRing) => {
      const renderer = new RecordingRenderer();
      createMiniMap(ring).draw(renderer, 1920, 1080, VIEW);
      return renderer.calls.flatMap((call) => (call.op === 'clipToEllipse' ? [call.args[0]] : []));
    };

    expect(clipOf(RING)).toEqual([{ x: 1636, y: 47, width: 255, height: 244 }]);
    expect(clipOf(other)).toEqual([{ x: 1520, y: 200, width: 300, height: 150 }]);
    expect(createMiniMap(other).mapAreaFor(1920, 1080)).not.toEqual(
      createMiniMap().mapAreaFor(1920, 1080),
    );
  });

  it('keeps the whole map visible inside the mini map', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1000, 800, VIEW);
    const mapArea = miniMap.mapAreaFor(1000, 800);

    // The map's far corner must land exactly on the map area's far corner: nothing cut off.
    const bottomRight = renderer.toScreen({ x: MAP.width, y: MAP.height });
    expect(bottomRight.x).toBeCloseTo(mapArea.x + mapArea.width);
    expect(bottomRight.y).toBeCloseTo(mapArea.y + mapArea.height);
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
    new MiniMapView(MAP, scene, RING).draw(renderer, 1000, 800, VIEW);

    // The mini map drew the obstacles too, without any change to MiniMapView.
    expect(drawObstacles).toHaveBeenCalledWith(renderer);
  });

  it('turns a click at the ring centre into the centre of the map', () => {
    const point = createMiniMap().worldPointAt(1763.5, 169, 1920, 1080);

    expect(point?.x).toBeCloseTo(MAP.width / 2);
    expect(point?.y).toBeCloseTo(MAP.height / 2);
  });

  it('clamps a click between the map and the ring to the map edge', () => {
    // 3 px inside the ring's left end: inside the ellipse, left of the map.
    const point = createMiniMap().worldPointAt(1636 + 3, 169, 1920, 1080);

    expect(point?.x).toBe(0);
    expect(point?.y).toBeCloseTo(MAP.height / 2);
  });

  it('ignores clicks outside the ring ellipse, even inside its box', () => {
    const miniMap = createMiniMap();
    // The top-left corner of the screen is far from the mini map.
    expect(miniMap.worldPointAt(10, 10, 1920, 1080)).toBeNull();
    // The ring box's top-left corner lies outside the ellipse.
    expect(ellipseDistance(1638, 49, miniMap.areaFor(1920, 1080))).toBeGreaterThan(1);
    expect(miniMap.worldPointAt(1638, 49, 1920, 1080)).toBeNull();
    // Before the first resize the screen is 0 × 0 and there is no mini map to click.
    expect(miniMap.worldPointAt(0, 0, 0, 0)).toBeNull();
  });

  it('shows new map features with no view code change (ADR 0009 minimap proof)', () => {
    // Draw the mini map of a generated map and keep only the marker calls.
    const minimapGlyphs = (map: MapDefinition) => {
      const renderer = new RecordingRenderer();
      new MiniMapView(map, new SceneView([new MapView(map)]), RING).draw(renderer, 1000, 800, VIEW);
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
    new MiniMapView(withBeacon, new SceneView([new MapView(withBeacon)]), RING).draw(
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
    new MiniMapView(MAP, scene, RING).draw(renderer, 1000, 800, VIEW);
    const roof = scenery.find((piece) => piece.id === 'cathedral-nave-roof');

    expect(roof).toBeDefined();
    expect(renderer.calls).toContainEqual({ op: 'fillPolygon', args: [roof?.shape, roof?.color] });
  });
});
