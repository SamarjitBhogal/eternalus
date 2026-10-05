import { DEFAULT_MAP_CONFIG, MapGenerator } from '@eternalus/core';
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
