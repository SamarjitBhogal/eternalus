import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { DefaultEntityView } from './DefaultEntityView';
import {
  FOCUS_RING_COLOR,
  MINIMAP_ENTITY_GLYPH,
  NEUTRAL_ENTITY_COLOR,
} from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';

const dummy = (team: EntitySnapshot['team']): EntitySnapshot => ({
  id: 'entity-1',
  kind: 'light-mob',
  family: 'mob',
  definitionId: 'training-dummy',
  team,
  transform: { x: 10, y: 20, radius: 0.4 },
  health: { current: 100, max: 100 },
});

const AT = { x: 10, y: 20 };

describe('DefaultEntityView', () => {
  it('draws a disc of its footprint in its team colour', () => {
    const renderer = new RecordingRenderer();

    new DefaultEntityView().draw(
      { entity: dummy('dark'), position: AT, isFocused: false },
      renderer,
    );

    expect(renderer.calls).toEqual([
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: 0.8 }, AT, TEAM_COLORS.dark] },
    ]);
  });

  it('adds a ring when the player controls it', () => {
    const renderer = new RecordingRenderer();

    new DefaultEntityView().draw(
      { entity: dummy('light'), position: AT, isFocused: true },
      renderer,
    );

    expect(renderer.calls.map((call) => call.op)).toEqual(['drawWorldGlyph', 'drawWorldGlyph']);
    expect(renderer.calls[1]).toMatchObject({ args: [{ shape: 'ring' }, AT, FOCUS_RING_COLOR] });
  });

  it('uses the neutral colour for neutral and team-less entities', () => {
    const renderer = new RecordingRenderer();
    const view = new DefaultEntityView();

    view.draw({ entity: dummy('neutral'), position: AT, isFocused: false }, renderer);
    view.drawMinimap({ entity: dummy(null), position: AT, isFocused: false }, renderer);

    expect(renderer.calls).toEqual([
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: 0.8 }, AT, NEUTRAL_ENTITY_COLOR] },
      { op: 'drawGlyph', args: [MINIMAP_ENTITY_GLYPH, AT, NEUTRAL_ENTITY_COLOR] },
    ]);
  });
});
