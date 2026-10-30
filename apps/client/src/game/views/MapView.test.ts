import { DEFAULT_MAP_CONFIG, type MapDecoration, MapGenerator } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { MapView } from './MapView';
import {
  FEATURE_STYLES,
  GROUND_COLOR,
  MINIMAP_ROLE_COLORS,
  TEAM_COLORS,
} from './MapView.constants';

/** The default generated map, the same one the game draws. */
const MAP = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, 1);

const footprintKinds = new Set(
  Object.entries(FEATURE_STYLES)
    .filter(([, style]) => style.shape === 'footprint')
    .map(([kind]) => kind),
);

/** Draws the map for the main view and returns the recorded calls. */
const drawMain = (): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  new MapView(MAP).draw(renderer);
  return renderer;
};

describe('MapView', () => {
  it('hides main-view building markers with roofs closed as well as open', () => {
    const building = MAP.features.find((feature) => feature.kind === 'cathedral');
    if (building === undefined) throw new Error('Missing building');
    for (const roofs of [new Set<string>(), new Set([building.id])]) {
      const renderer = new RecordingRenderer();
      new MapView(MAP, [], roofs, undefined, [{ id: building.id, footprint: [] }]).draw(renderer);
      const glyphs = renderer.calls.filter((call) => call.op === 'drawWorldGlyph');
      expect(glyphs.some((call) => call.args[1] === building.position)).toBe(false);
      expect(glyphs).toHaveLength(
        MAP.features.filter((feature) => !footprintKinds.has(feature.kind)).length - 1,
      );
    }
  });
  it('removes destroyed feature markers from the minimap', () => {
    const feature = MAP.features[0];
    if (feature === undefined) throw new Error('Missing feature');
    const renderer = new RecordingRenderer();
    new MapView(MAP, [], new Set(), undefined, [], (id) => id === feature.id).drawMinimap(renderer);
    expect(renderer.calls.filter((call) => call.op === 'drawGlyph')).toHaveLength(
      MAP.features.length - 1,
    );
  });
  it('keeps capture data while hiding the covered marker in an open cutaway', () => {
    const cathedral = MAP.features.find((f) => f.kind === 'cathedral');
    expect(cathedral).toBeDefined();
    const renderer = new RecordingRenderer();
    new MapView(MAP, [], new Set([cathedral?.id ?? ''])).draw(renderer);
    const glyphs = renderer.calls.filter((c) => c.op === 'drawWorldGlyph');
    expect(glyphs).toHaveLength(MAP.features.filter((f) => !footprintKinds.has(f.kind)).length - 1);
    expect(glyphs.some((c) => c.args[1] === cathedral?.position)).toBe(false);
    const minimap = new RecordingRenderer();
    new MapView(MAP, [], new Set(MAP.features.map((f) => f.id))).drawMinimap(minimap);
    const markers = minimap.calls.filter((c) => c.op === 'drawGlyph');
    expect(markers).toHaveLength(MAP.features.length);
    expect(markers.some((c) => c.args[1] === cathedral?.position)).toBe(true);
  });
  it('draws the ground first, then every terrain shape, then footprint features', () => {
    const fills = drawMain().calls.flatMap((call) =>
      call.op === 'fillPolygon' ? [call.args] : [],
    );
    const footprints = MAP.features.filter((feature) => footprintKinds.has(feature.kind));

    // One fill for the ground, one per terrain shape, one per wall segment or gate.
    expect(fills).toHaveLength(1 + MAP.terrain.length + footprints.length);
    // The first fill is the ground, so everything else sits on top of it.
    expect(fills[0]?.[1]).toBe(GROUND_COLOR);
  });

  it('draws ground scenery right after the ground, under the terrain, and skips detail scenery', () => {
    const shape = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];
    const scenery: readonly MapDecoration[] = [
      { id: 'meadow', shape, color: '#010101', layer: 'ground' },
      { id: 'roof', shape, color: '#020202', layer: 'detail' },
    ];
    const renderer = new RecordingRenderer();
    new MapView(MAP, scenery).draw(renderer);
    const colors = renderer.calls.flatMap((call) =>
      call.op === 'fillPolygon' ? [call.args[1]] : [],
    );

    expect(colors.slice(0, 2)).toEqual([GROUND_COLOR, '#010101']);
    expect(colors).not.toContain('#020202');
  });

  it('draws one line per lane', () => {
    const lines = drawMain().calls.filter((call) => call.op === 'strokePath');

    expect(lines).toHaveLength(MAP.lanes.length);
  });

  it('draws one glyph per other feature, styled by kind, in team colours for team features', () => {
    const glyphs = drawMain().calls.flatMap((call) =>
      call.op === 'drawWorldGlyph' ? [call.args] : [],
    );
    const glyphFeatures = MAP.features.filter((feature) => !footprintKinds.has(feature.kind));
    const tower = MAP.features.find((feature) => feature.id === 'light-spawner-tower-lane-0-0');

    expect(glyphs).toHaveLength(glyphFeatures.length);
    expect(glyphs).toContainEqual([
      FEATURE_STYLES['spawner-tower'],
      tower?.position,
      TEAM_COLORS.light,
    ]);
    expect(glyphs.map((args) => args[2])).toContain(TEAM_COLORS.dark);
  });

  it('draws the mini map with each feature’s own minimap glyph', () => {
    const renderer = new RecordingRenderer();
    new MapView(MAP).drawMinimap(renderer);
    const glyphs = renderer.calls.flatMap((call) => (call.op === 'drawGlyph' ? [call.args] : []));

    expect(glyphs).toHaveLength(MAP.features.length);
    MAP.features.forEach((feature, index) => {
      expect(glyphs[index]?.[0]).toBe(feature.minimapGlyph);
      expect(glyphs[index]?.[1]).toBe(feature.position);
    });
    const cathedral = MAP.features.findIndex((feature) => feature.kind === 'cathedral');
    expect(glyphs[cathedral]?.[2]).toBe(MINIMAP_ROLE_COLORS.objective);
    const darkStronghold = MAP.features.findIndex((feature) => feature.id === 'dark-stronghold');
    expect(glyphs[darkStronghold]?.[2]).toBe(TEAM_COLORS.dark);
  });
});
