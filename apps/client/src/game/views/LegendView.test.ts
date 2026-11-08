import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { EntityView } from './EntityView.types';
import {
  FACING_CHEVRON,
  FOCUS_RING_COLOR,
  LEGEND_OUTLINE_COLOR,
  MINI_MAP_LEGEND_GLYPH,
  MINI_MAP_MOB_GLYPH,
  MINI_MAP_OUTLINE_COLORS,
} from './entityViews.constants';
import { LegendView } from './LegendView';
import { TEAM_COLORS } from './MapView.constants';
import { MobView } from './MobView';

const WARRIOR: EntitySnapshot = {
  id: 'entity-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5, facing: { x: 0, y: 1 } },
  health: { current: 600, max: 600 },
  area: null,
  capture: null,
};

const AT = { x: 0, y: 0 };

const SOUTH = { x: 0, y: 1 };

describe('LegendView', () => {
  it('draws a white outline and the facing chevron under the team disc (DEC-192)', () => {
    const renderer = new RecordingRenderer();

    new LegendView().draw(
      { entity: WARRIOR, position: AT, facing: SOUTH, isFocused: false },
      renderer,
    );

    expect(renderer.calls).toEqual([
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: 1.25 }, AT, LEGEND_OUTLINE_COLOR] },
      {
        op: 'strokePath',
        args: [expect.any(Array), FACING_CHEVRON.color, FACING_CHEVRON.lineWidth],
      },
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: 1 }, AT, TEAM_COLORS.light] },
    ]);
  });

  it("adds the focus ring on top when it is the player's Legend", () => {
    const renderer = new RecordingRenderer();

    new LegendView().draw(
      { entity: WARRIOR, position: AT, facing: SOUTH, isFocused: true },
      renderer,
    );

    expect(renderer.calls.at(-1)).toMatchObject({
      args: [{ shape: 'ring' }, AT, FOCUS_RING_COLOR],
    });
  });

  it('marks the minimap with a dot larger than a mob, on a team outline, above mobs', () => {
    // Exactly these two glyphs: the facing chevron is main view only (DEC-192).
    const renderer = new RecordingRenderer();
    const view = new LegendView();

    view.drawMinimap({ entity: WARRIOR, position: AT, facing: SOUTH, isFocused: false }, renderer);

    expect(renderer.calls).toEqual([
      { op: 'drawGlyph', args: [expect.anything(), AT, MINI_MAP_OUTLINE_COLORS.light] },
      { op: 'drawGlyph', args: [MINI_MAP_LEGEND_GLYPH, AT, TEAM_COLORS.light] },
    ]);
    expect(MINI_MAP_LEGEND_GLYPH.size).toBeGreaterThan(MINI_MAP_MOB_GLYPH.size);
    const mobs: EntityView = new MobView();
    expect(view.minimapLayer).toBeGreaterThan(mobs.minimapLayer ?? 0);
  });
});
