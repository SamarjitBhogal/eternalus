import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { FOCUS_RING_COLOR, LEGEND_VISUAL_DIAMETER } from './entityViews.constants';
import { LegendSpriteView } from './LegendSpriteView';
import { LEGEND_SPRITE_RING_SCALE } from './LegendSpriteView.constants';
import { LegendView } from './LegendView';
import type { LegendSpriteSource } from './LegendSpriteView.types';
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
  elevation: null,
  progression: null,
  area: null,
  capture: null,
  aura: null,
  gem: null,
};
const state = {
  entity,
  position: { x: 1, y: 2 },
  isFocused: true,
  frameTick: 0,
  time: 0,
  facing: { x: 0, y: 1 },
};
const FRAME = { atlasId: 'oracle-sprites', frame: 3 } as const;
/** A Legend that draws `FRAME` 6.8 m wide, its top 5.1 m above its feet (the sheet's data). */
const SPRITES: LegendSpriteSource = {
  sizeOf: () => ({ width: 6.8, top: 5.1 }),
  frameOf: () => FRAME,
};
/** A Legend without a sprite (no sheet, or its atlas did not load). */
const NO_SPRITES: LegendSpriteSource = { sizeOf: () => null, frameOf: () => null };

describe('LegendSpriteView', () => {
  it('draws the frame with its feet on the position, then the team ring and the focus ring', () => {
    const renderer = new RecordingRenderer();
    new LegendSpriteView(SPRITES).draw(state, renderer);
    const glyphs = renderer.calls.flatMap((call) => (call.op === 'drawWorldGlyph' ? [call] : []));

    // The view passes only the position and the width: the renderer stands the sprite on its feet.
    expect(renderer.calls[0]).toEqual({ op: 'drawSprite', args: [FRAME, { x: 1, y: 2 }, 6.8] });
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

  it("picks its frame from the draw state's frame time (DEC-398, card PR170 (12))", () => {
    const asked: number[] = [];
    const view = new LegendSpriteView({
      ...SPRITES,
      frameOf: (_, frameTick) => {
        asked.push(frameTick);
        return FRAME;
      },
    });
    view.draw({ ...state, frameTick: 9.5 }, new RecordingRenderer());
    view.draw({ ...state, frameTick: 15 }, new RecordingRenderer());

    expect(asked).toEqual([9.5, 15]);
  });

  it('gives the sprite top for the health bar and half the sprite width for clicks (DEC-424)', () => {
    const view = new LegendSpriteView(SPRITES);

    expect(view.visualTopOf(state)).toBe(5.1);
    expect(view.visualRadiusOf(entity)).toBe(6.8 / 2);
    // `LegendView`'s own draw asks without an entity: its disc keeps DEC-238's radius.
    expect(view.visualRadiusOf()).toBe(LEGEND_VISUAL_DIAMETER / 2);
  });

  it('draws any other Legend as the ordinary Legend view, with the bar on its radius', () => {
    const view = new LegendSpriteView(NO_SPRITES);
    const drawn = new RecordingRenderer();
    const ordinary = new RecordingRenderer();
    view.draw(state, drawn);
    new LegendView().draw(state, ordinary);

    expect(drawn.calls).toEqual(ordinary.calls);
    expect(view.visualTopOf(state)).toBe(LEGEND_VISUAL_DIAMETER / 2);
    expect(view.visualRadiusOf(entity)).toBe(LEGEND_VISUAL_DIAMETER / 2);
  });

  it('draws a Legend with a sheet but no frame (dead) as the ordinary Legend view', () => {
    const drawn = new RecordingRenderer();
    const ordinary = new RecordingRenderer();
    new LegendSpriteView({ ...SPRITES, frameOf: () => null }).draw(state, drawn);
    new LegendView().draw(state, ordinary);

    expect(drawn.calls).toEqual(ordinary.calls);
  });

  it('keeps the Legend minimap marker', () => {
    const renderer = new RecordingRenderer();
    new LegendSpriteView(SPRITES).drawMinimap(state, renderer);

    expect(renderer.calls.some((call) => call.op === 'drawGlyph')).toBe(true);
  });
});
