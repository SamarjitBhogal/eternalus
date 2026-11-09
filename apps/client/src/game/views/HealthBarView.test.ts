import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { HealthBarView } from './HealthBarView';
import { HEALTH_BAR_FILL_COLORS, HEALTH_BAR_TRACK_COLOR } from './HealthBarView.constants';

const unit: EntitySnapshot = {
  id: 'foe',
  kind: 'light-mob',
  family: 'mob',
  definitionId: 'training-dummy',
  team: 'dark',
  transform: { x: 0, y: 0, radius: 0.5 },
  health: { current: 5, max: 10 },
  area: null,
  capture: null,
};

/** The colours `HealthBarView` fills for `entity`, in drawing order. */
const fills = (entity: EntitySnapshot): unknown[] => {
  const renderer = new RecordingRenderer();
  new HealthBarView().draw(
    { entity, position: { x: 0, y: 0 }, isFocused: false },
    'enemy',
    renderer,
  );
  return renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args[1]] : []));
};

describe('HealthBarView', () => {
  it('draws the track, then the health left, for a unit with health and a place', () => {
    expect(fills(unit)).toEqual([HEALTH_BAR_TRACK_COLOR, HEALTH_BAR_FILL_COLORS.enemy]);
  });

  it('draws nothing for an entity without health or without a place', () => {
    expect(fills({ ...unit, health: null })).toEqual([]);
    expect(fills({ ...unit, transform: null })).toEqual([]);
  });
});
