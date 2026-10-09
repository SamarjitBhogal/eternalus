import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { MOB_OUTLINE_COLOR, MOB_OUTLINE_SCALE } from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';
import { MobView } from './MobView';

const MINION: EntitySnapshot = {
  id: 'entity-2',
  kind: 'light-mob',
  family: 'mob',
  definitionId: 'light-minion',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.4 },
  health: { current: 150, max: 150 },
};

const AT = { x: 0, y: 0 };

const DIAMETER = (MINION.transform?.radius ?? 0) * 2;

describe('MobView', () => {
  it('draws a dark outline under the team disc, so mobs show on their own Stronghold', () => {
    const renderer = new RecordingRenderer();

    new MobView().draw({ entity: MINION, position: AT, isFocused: false }, renderer);

    expect(renderer.calls).toEqual([
      {
        op: 'drawWorldGlyph',
        args: [{ shape: 'dot', size: DIAMETER * MOB_OUTLINE_SCALE }, AT, MOB_OUTLINE_COLOR],
      },
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: DIAMETER }, AT, TEAM_COLORS.light] },
    ]);
  });
});
