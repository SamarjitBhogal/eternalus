import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { ERUPTION_LOOK } from './EruptionView.constants';
import { EruptionView } from './EruptionView';
import type { EruptionBurst } from './EruptionView.types';

const AT = { x: 400, y: 300 };

const drawn = (burst: EruptionBurst | null) => {
  const renderer = new RecordingRenderer();
  new EruptionView(() => burst).draw(renderer);
  return renderer.calls;
};

describe('EruptionView (Aryan 2026-11-22)', () => {
  it('draws nothing without a burst', () => {
    expect(drawn(null)).toEqual([]);
  });

  it('opens with the full white flash and no rings yet', () => {
    const { flash } = ERUPTION_LOOK;

    expect(drawn({ at: AT, progress: 0 })).toEqual([
      { op: 'drawWorldGlyph', args: [{ shape: 'dot', size: flash.size }, AT, flash.color] },
    ]);
  });

  it('grows both rings out from the gem once the flash is gone', () => {
    const [first, second] = ERUPTION_LOOK.rings;
    const progress = 0.6;

    expect(drawn({ at: AT, progress })).toEqual([
      {
        op: 'drawWorldGlyph',
        args: [{ shape: 'ring', size: first.size * progress }, AT, first.color],
      },
      {
        op: 'drawWorldGlyph',
        args: [
          { shape: 'ring', size: second.size * ((progress - second.delay) / (1 - second.delay)) },
          AT,
          second.color,
        ],
      },
    ]);
  });

  it('marks nothing on the mini map', () => {
    const renderer = new RecordingRenderer();

    new EruptionView(() => ({ at: AT, progress: 0 })).drawMinimap();

    expect(renderer.calls).toEqual([]);
  });
});
