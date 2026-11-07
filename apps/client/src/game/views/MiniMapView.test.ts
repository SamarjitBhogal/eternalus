import {
  DEFAULT_MAP_CONFIG,
  type EntitySnapshot,
  type MapDefinition,
  type MapFeature,
  MapGenerator,
  MapPresentationBuilder,
  type Snapshot,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { Canvas2dRenderer } from '../engine/render/Canvas2dRenderer';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { DrawContext } from '../engine/render/Canvas2dRenderer.types';
import type { ScreenRect, WorldPoint } from '../engine/render/Renderer.types';
import { createDefaultViewRegistry } from './defaultViewRegistry';
import { EntityLayer } from './EntityLayer';
import { MINI_MAP_MOB_GLYPH } from './entityViews.constants';
import { MapView } from './MapView';
import { TEAM_COLORS } from './MapView.constants';
import { MiniMapView } from './MiniMapView';
import {
  MINI_MAP_BACKGROUND_COLOR,
  MINI_MAP_CENTER_COLOR,
  MINI_MAP_CENTER_GLYPH,
  MINI_MAP_VIEW_RADIUS,
} from './MiniMapView.constants';
import type { MiniMapRing } from './MiniMapView.types';
import { SceneryView } from './SceneryView';
import { SceneView } from './SceneView';
import type { WorldLayer } from './SceneView.types';

/** The default generated map, the same one the game draws. */
const MAP = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, 1);

/** A pretend player position, in map units: the centre the tests' mini maps are given. */
const CENTRE = { x: 300, y: 500 };

/**
 * The HUD ring as `Match` injects it (Figma 65:743: 255 × 244 at 1636, 47 in the 1920 × 1080
 * frame, 4 px stroke). Written out here because views import nothing from `bridge/` (01 §2).
 */
const RING: MiniMapRing = {
  frame: { width: 1920, height: 1080 },
  box: { right: 29, top: 47, width: 255, height: 244 },
  strokeWidth: 4,
};

/** A mini map centred on `CENTRE` whose scene is just the map. */
const createMiniMap = (ring: MiniMapRing = RING): MiniMapView =>
  new MiniMapView(MAP, new MapView(MAP), ring, () => CENTRE);

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
  it('shows a circle of radius 200 world units (owner 2026-11-04, DEC-182)', () => {
    expect(MINI_MAP_VIEW_RADIUS).toBe(200);
  });

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

  it('draws the view as a square that covers the ring inside the stroke, centred in the ring', () => {
    const miniMap = createMiniMap();
    const viewArea = miniMap.viewAreaFor(1920, 1080);

    expect(viewArea.width).toBe(viewArea.height);
    // The longer ring side (255) less the 4 px stroke each side.
    expect(viewArea.width).toBeCloseTo(255 - 8);
    expect(viewArea.x + viewArea.width / 2).toBeCloseTo(1763.5);
    expect(viewArea.y + viewArea.height / 2).toBeCloseTo(169);
  });

  it('draws everything inside the clip to the ring ellipse, and no border', () => {
    const renderer = new RecordingRenderer();
    const mapDraw = vi.spyOn(MapView.prototype, 'drawMinimap');
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1920, 1080);
    const area = miniMap.areaFor(1920, 1080);

    // RecordingRenderer runs the clipped drawing at once, so it is recorded after the clip.
    expect(renderer.calls[0]).toEqual({ op: 'clipToEllipse', args: [area, expect.any(Function)] });
    expect(renderer.calls[1]).toEqual({
      op: 'fillScreenRect',
      args: [area, MINI_MAP_BACKGROUND_COLOR],
    });
    expect(renderer.calls[2]).toEqual({
      op: 'showWorldArea',
      args: [
        {
          x: CENTRE.x - MINI_MAP_VIEW_RADIUS,
          y: CENTRE.y - MINI_MAP_VIEW_RADIUS,
          width: MINI_MAP_VIEW_RADIUS * 2,
          height: MINI_MAP_VIEW_RADIUS * 2,
        },
        miniMap.viewAreaFor(1920, 1080),
      ],
    });
    expect(mapDraw).toHaveBeenCalledWith(renderer);
    expect(renderer.calls.map((call) => call.op)).not.toContain('strokeScreenRect');

    // With a clip that never runs its drawing, nothing at all reaches the screen.
    const held = new RecordingRenderer();
    vi.spyOn(held, 'clipToEllipse').mockImplementation(() => undefined);
    miniMap.draw(held, 1920, 1080);
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
      createMiniMap(ring).draw(renderer, 1920, 1080);
      return renderer.calls.flatMap((call) => (call.op === 'clipToEllipse' ? [call.args[0]] : []));
    };

    expect(clipOf(RING)).toEqual([{ x: 1636, y: 47, width: 255, height: 244 }]);
    expect(clipOf(other)).toEqual([{ x: 1520, y: 200, width: 300, height: 150 }]);
    expect(createMiniMap(other).viewAreaFor(1920, 1080)).not.toEqual(
      createMiniMap().viewAreaFor(1920, 1080),
    );
  });

  it('puts the player at the ring centre and the radius-200 circle at the ring edge', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
    const miniMap = createMiniMap();
    miniMap.draw(renderer, 1000, 800);
    const area = miniMap.areaFor(1000, 800);
    const viewArea = miniMap.viewAreaFor(1000, 800);

    const centre = renderer.toScreen(CENTRE);
    expect(centre.x).toBeCloseTo(area.x + area.width / 2);
    expect(centre.y).toBeCloseTo(area.y + area.height / 2);
    // The circle's edge is the edge of the view square, which covers the ring inside its stroke.
    const east = renderer.toScreen({ x: CENTRE.x + MINI_MAP_VIEW_RADIUS, y: CENTRE.y });
    expect(east.x - centre.x).toBeCloseTo(viewArea.width / 2);
  });

  it('moves the map, not the marker, when the centre moves (north stays up)', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
    let centre: WorldPoint = CENTRE;
    const miniMap = new MiniMapView(MAP, new MapView(MAP), RING, () => centre);
    const markerAt = (point: WorldPoint) => {
      centre = point;
      const glyph = vi.spyOn(renderer, 'drawGlyph');
      miniMap.draw(renderer, 1000, 800);
      const call = glyph.mock.calls.find((c) => c[2] === MINI_MAP_CENTER_COLOR);
      glyph.mockRestore();
      return call;
    };
    const first = markerAt(CENTRE);
    const originBefore = renderer.toScreen({ x: 0, y: 0 });
    const second = markerAt({ x: CENTRE.x + 50, y: CENTRE.y });
    const originAfter = renderer.toScreen({ x: 0, y: 0 });

    expect(first?.[0]).toEqual(MINI_MAP_CENTER_GLYPH);
    expect(first?.[1]).toEqual(CENTRE);
    expect(second?.[1]).toEqual({ x: CENTRE.x + 50, y: CENTRE.y });
    // The map slid left by 50 world units, with no rotation or zoom.
    const scale = miniMap.viewAreaFor(1000, 800).width / (MINI_MAP_VIEW_RADIUS * 2);
    expect(originBefore.x - originAfter.x).toBeCloseTo(50 * scale);
    expect(originBefore.y).toBeCloseTo(originAfter.y);
  });

  it('shows layers added to the scene later with no change to the mini map', () => {
    const renderer = new Canvas2dRenderer(createFakeContext());
    // A fake "obstacles" layer, like one a teammate might add later.
    const drawObstacles = vi.fn();
    const obstacles: WorldLayer = { draw: vi.fn(), drawMinimap: drawObstacles };
    const scene = new SceneView([new MapView(MAP), obstacles]);
    new MiniMapView(MAP, scene, RING, () => CENTRE).draw(renderer, 1000, 800);

    // The mini map drew the obstacles too, without any change to MiniMapView.
    expect(drawObstacles).toHaveBeenCalledWith(renderer);
  });

  it('turns a click at the ring centre into the centre point', () => {
    const point = createMiniMap().worldPointAt(1763.5, 169, 1920, 1080);

    expect(point?.x).toBeCloseTo(CENTRE.x);
    expect(point?.y).toBeCloseTo(CENTRE.y);
  });

  it('turns a click at the ring edge into a point 200 units from the centre', () => {
    // The ring's right end is 127.5 px from the centre; the circle covers 123.5 px of it.
    const point = createMiniMap().worldPointAt(1763.5 + 123.5, 169, 1920, 1080);

    expect(point?.x).toBeCloseTo(CENTRE.x + MINI_MAP_VIEW_RADIUS);
    expect(point?.y).toBeCloseTo(CENTRE.y);
  });

  it('clamps a click that points past the map edge to the map edge', () => {
    const nearWest = new MiniMapView(MAP, new MapView(MAP), RING, () => ({ x: 20, y: 100 }));
    const point = nearWest.worldPointAt(1763.5 - 100, 169, 1920, 1080);

    expect(point?.x).toBe(0);
    expect(point?.y).toBeCloseTo(100);
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
      const scene = new SceneView([new MapView(map)]);
      new MiniMapView(map, scene, RING, () => CENTRE).draw(renderer, 1000, 800);
      return renderer.calls.flatMap((call) =>
        call.op === 'drawGlyph' && call.args[2] !== MINI_MAP_CENTER_COLOR ? [call.args] : [],
      );
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
    const scene = new SceneView([new MapView(withBeacon)]);
    new MiniMapView(withBeacon, scene, RING, () => CENTRE).draw(renderer, 1000, 800);
    const glyphs = renderer.calls.flatMap((call) => (call.op === 'drawGlyph' ? [call.args] : []));

    expect(glyphs).toContainEqual([beacon.minimapGlyph, beacon.position, expect.any(String)]);
  });
});

describe('MiniMapView with scenery', () => {
  it('draws the cathedral architecture through the same scenery layer on the minimap', () => {
    const scenery = new MapPresentationBuilder().build(MAP).scenery;
    const renderer = new RecordingRenderer();
    const scene = new SceneView([new MapView(MAP, scenery), new SceneryView(scenery, 'detail')]);
    new MiniMapView(MAP, scene, RING, () => CENTRE).draw(renderer, 1000, 800);
    const roof = scenery.find((piece) => piece.id === 'cathedral-nave-roof');

    expect(roof).toBeDefined();
    expect(renderer.calls).toContainEqual({ op: 'fillPolygon', args: [roof?.shape, roof?.color] });
  });
});

describe('MiniMapView unit markers (DEC-187)', () => {
  it("draws the units through the scene's entity layer, under the centre marker", () => {
    const minion: EntitySnapshot = {
      id: 'm',
      kind: 'light-mob',
      family: 'mob',
      definitionId: 'light-minion',
      team: 'light',
      transform: { x: CENTRE.x + 10, y: CENTRE.y, radius: 0.4 },
      health: { current: 150, max: 150 },
    };
    const counters = { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} };
    const snapshot: Snapshot = {
      tick: 1,
      match: { phase: 'countdown', phaseEnteredTick: 0, upcoming: [], humanLegendId: null },
      entities: [minion],
      hordes: [],
      teams: { light: counters, dark: counters },
    };
    const units = new EntityLayer(createDefaultViewRegistry(), () => false);
    units.show(null, snapshot, 0, null);
    const renderer = new RecordingRenderer();
    new MiniMapView(MAP, new SceneView([units]), RING, () => CENTRE).draw(renderer, 1920, 1080);
    const glyphs = renderer.calls.flatMap((call) => (call.op === 'drawGlyph' ? [call.args] : []));

    const at = { x: CENTRE.x + 10, y: CENTRE.y };
    expect(glyphs.at(-2)).toEqual([MINI_MAP_MOB_GLYPH, at, TEAM_COLORS.light]);
    expect(glyphs.at(-1)).toEqual([MINI_MAP_CENTER_GLYPH, CENTRE, MINI_MAP_CENTER_COLOR]);
    // A mob's marker is outlined and larger, so it never looks like a turret's plain dot.
    const turret = MAP.features.find((feature) => feature.kind === 'turret')?.minimapGlyph;
    const outline = glyphs.at(-3);
    expect(outline?.[1]).toEqual(at);
    expect(outline?.[2]).not.toBe(TEAM_COLORS.light);
    expect(outline?.[0].size).toBeGreaterThan(MINI_MAP_MOB_GLYPH.size);
    expect(outline?.[0].size).toBeGreaterThan(turret?.size ?? Infinity);
  });
});
