import { describe, expect, it } from 'vitest';

import { Capturable } from '../../components/Capturable';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { CAPTURE_POINT } from '../../content/zones/capturePoint';
import { CapturePoint } from '../../entities/zones/CapturePoint';
import { GameState } from '../../state/GameState';
import { CaptureProgressBoundsInvariant } from './CaptureProgressBoundsInvariant';

const stateWithPoint = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const point = new CapturePoint('entity-1', CAPTURE_POINT.id);
  point.spawn({
    definition: CAPTURE_POINT,
    position: { x: 10, y: 10 },
    team: 'neutral',
    area: [
      [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 10, y: 20 },
      ],
    ],
  });
  state.entities.add(point);
  return { state, zone: point.getComponent(Capturable) };
};

describe('CaptureProgressBoundsInvariant', () => {
  it('holds for a neutral zone and for fully Light and fully Dark zones', () => {
    const { state, zone } = stateWithPoint();
    const invariant = new CaptureProgressBoundsInvariant();
    expect(invariant.check(state)).toEqual([]);

    zone.setProgress(1, 3);
    expect(invariant.check(state)).toEqual([]);
    zone.setProgress(-1, 3);
    expect(invariant.check(state)).toEqual([]);
  });

  it('flags progress past full and a checkpoint past the configured count (injected corruption)', () => {
    const { state, zone } = stateWithPoint();
    const invariant = new CaptureProgressBoundsInvariant();

    zone.setProgress(1.5, 3);
    expect(invariant.check(state)).toEqual([
      {
        invariantId: 'capture-progress-bounds',
        severity: 'error',
        message:
          'Capture point "entity-1" has progress 1.5 (allowed -1..1) and checkpoint 3 (allowed 0..3).',
        entityId: 'entity-1',
        details: { progress: 1.5, checkpoint: 3, checkpoints: 3 },
      },
    ]);

    zone.setProgress(-0.5, 4);
    expect(invariant.check(state)).toHaveLength(1);
    zone.setProgress(Number.NaN, 0);
    expect(invariant.check(state)).toHaveLength(1);
    zone.setProgress(0.2, 0.5);
    expect(invariant.check(state)).toHaveLength(1);
  });
});
