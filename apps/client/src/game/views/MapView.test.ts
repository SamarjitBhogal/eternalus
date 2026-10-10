import { MAP_1 } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { Renderer } from '../engine/Renderer';
import type { DrawContext } from '../engine/Renderer.types';
import { MapView } from './MapView';
import { GROUND_COLOR, TEAM_COLORS } from './MapView.constants';

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

/** A renderer on a 1600 x 900 screen showing the whole of map-1. */
const createRenderer = (): Renderer => {
  const renderer = new Renderer(createFakeContext());
  renderer.resize(1600, 900);
  renderer.fitWorld(MAP_1.width, MAP_1.height);
  return renderer;
};

describe('MapView', () => {
  it('keeps capture data while hiding the covered marker behind an open building cutaway', () => {
    const renderer = createRenderer();
    const squares = vi.spyOn(renderer, 'fillSquare');
    new MapView(MAP_1, new Set(['grand-cathedral'])).draw(renderer);
    expect(squares).toHaveBeenCalledTimes(MAP_1.features.length - 1);
    expect(MAP_1.features.find((feature) => feature.id === 'grand-cathedral')?.position).toEqual({
      x: 6400,
      y: 3600,
    });
    expect(squares.mock.calls.some((call) => call[0].x === 6400 && call[0].y === 3600)).toBe(false);
  });
  it('draws the ground first, then every terrain shape', () => {
    const renderer = createRenderer();
    // Spy on fillPolygon to record every shape MapView fills.
    const fillPolygon = vi.spyOn(renderer, 'fillPolygon');
    new MapView(MAP_1).draw(renderer);

    // One fill for the ground plus one per terrain shape (grey edges, rift, walls).
    expect(fillPolygon).toHaveBeenCalledTimes(
      1 +
        MAP_1.terrain.length +
        (MAP_1.scenery?.filter((piece) => piece.layer === 'ground').length ?? 0),
    );
    // The first fill is the ground, so everything else sits on top of it.
    expect(fillPolygon.mock.calls[0]?.[1]).toBe(GROUND_COLOR);
  });

  it('draws one line per lane', () => {
    const renderer = createRenderer();
    // Spy on strokePath to record every line MapView draws.
    const strokePath = vi.spyOn(renderer, 'strokePath');
    new MapView(MAP_1).draw(renderer);

    // Map-1 has three lanes, so three lines.
    expect(strokePath).toHaveBeenCalledTimes(MAP_1.lanes.length);
  });

  it('draws one marker per feature, in team colours for team features', () => {
    const renderer = createRenderer();
    // Spy on fillSquare to record every marker MapView draws.
    const fillSquare = vi.spyOn(renderer, 'fillSquare');
    new MapView(MAP_1).draw(renderer);

    // One square per feature: capitals, buildings, cathedral, crossings, objectives.
    expect(fillSquare).toHaveBeenCalledTimes(MAP_1.features.length);
    // The colour is the third thing passed to fillSquare; collect them all.
    const colors = fillSquare.mock.calls.map((call) => call[2]);
    // Both teams' colours must appear, so team buildings are coloured correctly.
    expect(colors).toContain(TEAM_COLORS.light);
    expect(colors).toContain(TEAM_COLORS.dark);
  });
});
