import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import {
  MINI_MAP_MOB_GLYPH,
  MINI_MAP_OUTLINE_COLORS,
  MINI_MAP_OUTLINE_WIDTH,
  MOB_OUTLINE_COLOR,
  FACING_CHEVRON,
  MOB_OUTLINE_SCALE,
  MOB_VISUAL_SCALE,
  NEUTRAL_ENTITY_COLOR,
} from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';
import { MobView } from './MobView';

const MINION: EntitySnapshot = {
  id: 'entity-2',
  kind: 'light-mob',
  family: 'mob',
  definitionId: 'light-minion',
  team: 'light',
  transform: { facing: { x: 1, y: 0 }, x: 0, y: 0, radius: 0.4 },
  health: { current: 150, max: 150 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem: null,
};

const AT = { x: 0, y: 0 };
const SOUTH = { x: 0, y: 1 };

const DIAMETER = (MINION.transform?.radius ?? 0) * 2 * MOB_VISUAL_SCALE;

describe('MobView', () => {
  it('draws a dark outline under the team disc, so mobs show on their own Stronghold', () => {
    const renderer = new RecordingRenderer();

    new MobView().draw(
      { facing: { x: 1, y: 0 }, entity: MINION, position: AT, isFocused: false },
      renderer,
    );

    expect(renderer.calls).toEqual([
      {
        op: 'drawWorldGlyph',
        args: [{ shape: 'dot', size: DIAMETER * MOB_OUTLINE_SCALE }, AT, MOB_OUTLINE_COLOR],
      },
      {
        op: 'strokePath', // DEC-192: mobs show their facing with a chevron.
        args: [expect.any(Array), FACING_CHEVRON.color, FACING_CHEVRON.lineWidth],
      },
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: DIAMETER }, AT, TEAM_COLORS.light] },
    ]);
  });

  it('draws the neutral Greater Boss in the neutral colour, at the mob display scale (DEC-238)', () => {
    const renderer = new RecordingRenderer();
    const boss: EntitySnapshot = {
      ...MINION,
      kind: 'heavy-mob',
      definitionId: 'greater-boss',
      team: 'neutral',
      transform: { x: 0, y: 0, radius: 2.5, facing: SOUTH },
    };

    new MobView().draw({ entity: boss, position: AT, facing: SOUTH, isFocused: false }, renderer);

    expect(renderer.calls.at(-1)).toEqual({
      op: 'drawWorldGlyph',
      args: [{ shape: 'dot', size: 2.5 * 2 * MOB_VISUAL_SCALE }, AT, NEUTRAL_ENTITY_COLOR],
    });
  });

  it('marks the minimap with a small team dot on a team outline (13 §7: not colour alone)', () => {
    const renderer = new RecordingRenderer();
    const view = new MobView();
    const at = (team: 'light' | 'dark' | 'neutral') => ({
      facing: { x: 1, y: 0 },
      entity: { ...MINION, team },
      position: AT,
      isFocused: false,
    });

    view.drawMinimap(at('light'), renderer);
    view.drawMinimap(at('dark'), renderer);
    view.drawMinimap(at('neutral'), renderer);

    const outline = { shape: 'dot', size: MINI_MAP_MOB_GLYPH.size + MINI_MAP_OUTLINE_WIDTH * 2 };
    expect(renderer.calls).toEqual([
      { op: 'drawGlyph', args: [outline, AT, MINI_MAP_OUTLINE_COLORS.light] },
      { op: 'drawGlyph', args: [MINI_MAP_MOB_GLYPH, AT, TEAM_COLORS.light] },
      { op: 'drawGlyph', args: [outline, AT, MINI_MAP_OUTLINE_COLORS.dark] },
      { op: 'drawGlyph', args: [MINI_MAP_MOB_GLYPH, AT, TEAM_COLORS.dark] },
      { op: 'drawGlyph', args: [outline, AT, MINI_MAP_OUTLINE_COLORS.neutral] },
      { op: 'drawGlyph', args: [MINI_MAP_MOB_GLYPH, AT, NEUTRAL_ENTITY_COLOR] },
    ]);
    // Each team has its own outline, so the outline alone tells the teams apart.
    expect(new Set(Object.values(MINI_MAP_OUTLINE_COLORS)).size).toBe(3);
  });
});
