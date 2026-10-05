import { DEFAULT_MAP_CONFIG, MapGenerator } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { Renderer } from '../engine/render/Renderer';
import { MapView } from './MapView';
import {
  FEATURE_STYLES,
  GROUND_COLOR,
  MINIMAP_ROLE_COLORS,
  TEAM_COLORS,
} from './MapView.constants';

/** The default generated map, the same one the game draws. */
const MAP = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, 1);

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

const footprintKinds = new Set(
  Object.entries(FEATURE_STYLES)
    .filter(([, style]) => style.shape === 'footprint')
    .map(([kind]) => kind),
);

describe('MapView', () => {
  it('draws the ground first, then every terrain shape, then footprint features', () => {
    const renderer = createRecordingRenderer();
    new MapView(MAP).draw(renderer);
    const footprints = MAP.features.filter((feature) => footprintKinds.has(feature.kind));

    // One fill for the ground, one per terrain shape, one per wall segment or gate.
    expect(renderer.fillPolygon).toHaveBeenCalledTimes(1 + MAP.terrain.length + footprints.length);
    // The first fill is the ground, so everything else sits on top of it.
    expect(renderer.fillPolygon.mock.calls[0]?.[1]).toBe(GROUND_COLOR);
  });

  it('draws one line per lane', () => {
    const renderer = createRecordingRenderer();
    new MapView(MAP).draw(renderer);

    // The default config has three lanes, so three lines.
    expect(renderer.strokePath).toHaveBeenCalledTimes(MAP.lanes.length);
  });

  it('draws one glyph per other feature, styled by kind, in team colours for team features', () => {
    const renderer = createRecordingRenderer();
    new MapView(MAP).draw(renderer);
    const glyphFeatures = MAP.features.filter((feature) => !footprintKinds.has(feature.kind));

    expect(renderer.drawWorldGlyph).toHaveBeenCalledTimes(glyphFeatures.length);
    const tower = MAP.features.find((feature) => feature.id === 'light-spawner-tower-lane-0-0');
    expect(renderer.drawWorldGlyph).toHaveBeenCalledWith(
      FEATURE_STYLES['spawner-tower'],
      tower?.position,
      TEAM_COLORS.light,
    );
    const colors = renderer.drawWorldGlyph.mock.calls.map((call) => call[2]);
    expect(colors).toContain(TEAM_COLORS.dark);
  });

  it('draws the mini map with each feature’s own minimap glyph', () => {
    const renderer = createRecordingRenderer();
    new MapView(MAP).drawMinimap(renderer);

    expect(renderer.drawGlyph).toHaveBeenCalledTimes(MAP.features.length);
    MAP.features.forEach((feature, index) => {
      expect(renderer.drawGlyph.mock.calls[index]?.[0]).toBe(feature.minimapGlyph);
      expect(renderer.drawGlyph.mock.calls[index]?.[1]).toBe(feature.position);
    });
    const cathedral = MAP.features.findIndex((feature) => feature.kind === 'cathedral');
    expect(renderer.drawGlyph.mock.calls[cathedral]?.[2]).toBe(MINIMAP_ROLE_COLORS.objective);
    const darkStronghold = MAP.features.findIndex((feature) => feature.id === 'dark-stronghold');
    expect(renderer.drawGlyph.mock.calls[darkStronghold]?.[2]).toBe(TEAM_COLORS.dark);
  });
});
