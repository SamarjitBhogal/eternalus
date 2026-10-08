import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import {
  LEGEND_OUTLINE_COLOR,
  MINIMAP_ENTITY_GLYPH,
  MINIMAP_LEGEND_GLYPH,
} from './entityViews.constants';
import { LegendView } from './LegendView';
import { TEAM_COLORS } from './MapView.constants';

const WARRIOR: EntitySnapshot = {
  id: 'entity-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5 },
  health: { current: 600, max: 600 },
};

const AT = { x: 0, y: 0 };

describe('LegendView', () => {
  it('draws a white outline under the team disc, so players stand out from mobs', () => {
    const renderer = new RecordingRenderer();

    new LegendView().draw({ entity: WARRIOR, position: AT, isFocused: false }, renderer);

    expect(renderer.calls).toEqual([
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: 1.25 }, AT, LEGEND_OUTLINE_COLOR] },
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: 1 }, AT, TEAM_COLORS.light] },
    ]);
  });

  it('shows a bigger minimap dot than other entities', () => {
    const renderer = new RecordingRenderer();

    new LegendView().drawMinimap({ entity: WARRIOR, position: AT, isFocused: true }, renderer);

    expect(renderer.calls).toEqual([
      { op: 'drawGlyph', args: [MINIMAP_LEGEND_GLYPH, AT, TEAM_COLORS.light] },
    ]);
    expect(MINIMAP_LEGEND_GLYPH.size).toBeGreaterThan(MINIMAP_ENTITY_GLYPH.size);
  });
});
