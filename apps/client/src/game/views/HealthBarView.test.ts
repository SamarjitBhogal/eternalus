import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { HealthBarView } from './HealthBarView';
import {
  HEALTH_BAR_FILL_COLORS,
  HEALTH_BAR_GAP,
  HEALTH_BAR_HEIGHT,
  HEALTH_BAR_TRACK_COLOR,
  HEALTH_BAR_WIDTH_SCALE,
} from './HealthBarView.constants';

const EAST = { x: 1, y: 0 };

const unit: EntitySnapshot = {
  id: 'foe',
  kind: 'light-mob',
  family: 'mob',
  definitionId: 'training-dummy',
  team: 'dark',
  transform: { x: 0, y: 0, radius: 0.5, facing: EAST },
  health: { current: 5, max: 10 },
  progression: null,
  area: null,
  capture: null,
};

/** The colours `HealthBarView` fills for `entity`, in drawing order. */
const fills = (entity: EntitySnapshot): unknown[] => {
  const renderer = new RecordingRenderer();
  new HealthBarView().draw(
    { entity, position: { x: 0, y: 0 }, facing: EAST, isFocused: false },
    'enemy',
    renderer,
  );
  return renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args[1]] : []));
};

describe('HealthBarView', () => {
  it('draws the track, then the health left, for a unit with health and a place', () => {
    expect(fills(unit)).toEqual([HEALTH_BAR_TRACK_COLOR, HEALTH_BAR_FILL_COLORS.enemy]);
  });

  it('centres the track over the footprint, a gap above it, and fills the health left from the left', () => {
    // 0.5 in radius, drawn at (10, 20), with 3 of 10 health.
    const renderer = new RecordingRenderer();
    const foe = { ...unit, health: { current: 3, max: 10 } };
    new HealthBarView().draw(
      { entity: foe, position: { x: 10, y: 20 }, facing: EAST, isFocused: false },
      'enemy',
      renderer,
    );
    const [track, fill] = renderer.calls.flatMap((call) =>
      call.op === 'fillPolygon' ? [call.args[0]] : [],
    );

    const width = 2 * 0.5 * HEALTH_BAR_WIDTH_SCALE;
    const bottom = 20 - 0.5 - HEALTH_BAR_GAP;
    expect(track?.[0]?.x).toBeCloseTo(10 - width / 2);
    expect(track?.[0]?.y).toBeCloseTo(bottom - HEALTH_BAR_HEIGHT);
    expect(track?.[2]?.x).toBeCloseTo(10 + width / 2);
    expect(track?.[2]?.y).toBeCloseTo(bottom);
    expect(fill?.[0]?.x).toBeCloseTo(10 - width / 2);
    expect(fill?.[2]?.x).toBeCloseTo(10 - width / 2 + width * 0.3);
  });

  it('draws nothing for an entity without health or without a place', () => {
    expect(fills({ ...unit, health: null })).toEqual([]);
    expect(fills({ ...unit, transform: null })).toEqual([]);
  });
});
