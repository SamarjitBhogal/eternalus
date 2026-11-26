import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { FOCUS_RING_COLOR } from './entityViews.constants';
import { LegendSpriteView } from './LegendSpriteView';
import { LEGEND_SPRITE_RING_SCALE } from './LegendSpriteView.constants';
import { LegendView } from './LegendView';
import { TEAM_COLORS } from './MapView.constants';

const entity: EntitySnapshot = {
  id: 'hero',
  kind: 'magus',
  family: 'legend',
  definitionId: 'magus',
  team: 'dark',
  transform: { x: 1, y: 2, radius: 0.75, facing: { x: 0, y: 1 } },
  health: { current: 800, max: 800 },
  aether: null,
  progression: null,
  area: null,
  capture: null,
  gem: null,
};
const state = { entity, position: { x: 1, y: 2 }, isFocused: true, facing: { x: 0, y: 1 } };
const FRAME = { atlasId: 'oracle-sprites', frame: 3 } as const;
/** `FRAME` on a sheet whose feet stand a quarter of the cell above its bottom edge. */
const SPRITE = { frame: FRAME, groundOffset: 0.25 } as const;

describe('LegendSpriteView', () => {
  it('draws the frame with its feet on the position, then the team ring and the focus ring', () => {
    const renderer = new RecordingRenderer();
    new LegendSpriteView(() => SPRITE, 6.8).draw(state, renderer);
    const glyphs = renderer.calls.flatMap((call) => (call.op === 'drawWorldGlyph' ? [call] : []));

    // The cell's bottom edge is 0.25 x 6.8 below the feet, so the feet stand on (1, 2).
    expect(renderer.calls[0]).toEqual({
      op: 'drawSprite',
      args: [FRAME, { x: 1, y: 2 + 6.8 * 0.25 }, 6.8],
    });
    expect(glyphs[0]?.args).toEqual([
      { shape: 'ring', size: 6.8 * LEGEND_SPRITE_RING_SCALE },
      { x: 1, y: 2 },
      TEAM_COLORS.dark,
    ]);
    expect(glyphs.at(-1)?.args).toEqual([
      { shape: 'ring', size: 6.8 },
      { x: 1, y: 2 },
      FOCUS_RING_COLOR,
    ]);
  });

  it('reports the sprite top above the position as its radius, so the health bar sits above it', () => {
    const view = new LegendSpriteView(() => SPRITE, 6.8);

    expect(view.visualRadiusOf(entity)).toBeCloseTo(6.8 * 0.75);
  });

  it('draws any other Legend as the ordinary Legend view, with its footprint radius', () => {
    const view = new LegendSpriteView(() => null, 6.8);
    const drawn = new RecordingRenderer();
    const ordinary = new RecordingRenderer();
    view.draw(state, drawn);
    new LegendView().draw(state, ordinary);

    expect(drawn.calls).toEqual(ordinary.calls);
    expect(view.visualRadiusOf(entity)).toBe(0.75);
  });

  it('keeps the Legend minimap marker', () => {
    const renderer = new RecordingRenderer();
    new LegendSpriteView(() => SPRITE, 6.8).drawMinimap(state, renderer);

    expect(renderer.calls.some((call) => call.op === 'drawGlyph')).toBe(true);
  });
});
