import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { ColossusView } from './ColossusView';
import type { EntityDrawState } from './EntityView.types';

const POS = { x: 2, y: 4 };
const FACING = { x: 1, y: 0 };
const BOSS: EntitySnapshot = {
  id: 'entity-1',
  kind: 'heavy-mob',
  family: 'mob',
  definitionId: 'cathedral-boss',
  team: 'neutral',
  transform: { ...POS, radius: 1.25, facing: FACING },
  health: null,
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem: null,
};
const STATE: EntityDrawState = {
  entity: BOSS,
  facing: FACING,
  position: POS,
  isFocused: false,
};
const CAST: NonNullable<EntitySnapshot['bossCast']> = {
  id: 'void-sweep',
  start: 10,
  fire: 20,
  recover: 30,
  end: 40,
  heading: 0,
  angle: 0,
  range: 180,
  width: 5,
};
const SHEET = { naturalWidth: 768, naturalHeight: 512 } as HTMLImageElement;
const IDLE = { naturalWidth: 768, naturalHeight: 512 } as HTMLImageElement;
const view = new ColossusView((id) => (id === 'colossus-idle' ? IDLE : SHEET));

describe('ColossusView', () => {
  it('cycles the movement atlas and mirrors it when facing right', () => {
    const renderer = new RecordingRenderer();
    view.draw({ ...STATE, isMoving: true, tick: 16 }, renderer);
    expect(renderer.calls).toEqual([
      {
        op: 'drawSprite',
        args: [
          SHEET,
          { x: 256, y: 256, width: 256, height: 256 },
          expect.objectContaining({ width: 48 }),
          true,
        ],
      },
    ]);
  });

  it('draws one aim line during charge and the layered beam only during the active phase', () => {
    const draw = (tick: number) => {
      const renderer = new RecordingRenderer();
      view.draw({ ...STATE, tick, entity: { ...BOSS, bossCast: CAST } }, renderer);
      return renderer.calls.filter((call) => call.op === 'strokePath');
    };
    expect(draw(19)).toHaveLength(1);
    const beam = draw(20);
    expect(beam).toHaveLength(3);
    expect(beam[2]?.args[0][1]).toEqual({ x: 182, y: 4 });
    expect(draw(30)).toHaveLength(0);
  });
});
