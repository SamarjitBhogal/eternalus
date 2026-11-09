import { describe, expect, it } from 'vitest';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { PlayerKnightView } from './PlayerKnightView';
import type { EntityDrawState } from './EntityView.types';

const image = {} as HTMLImageElement;
const state: EntityDrawState = {
  entity: {
    id: 'hero',
    kind: 'warrior',
    family: 'legend',
    definitionId: 'warrior',
    team: 'light',
    transform: { x: 10, y: 20, radius: 0.5 },
    health: { current: 100, max: 100 },
  },
  position: { x: 10, y: 20 },
  isFocused: true,
};

describe('PlayerKnightView', () => {
  it('crops the exact requested cell and anchors the art without mutating the snapshot', () => {
    const renderer = new RecordingRenderer();
    const view = new PlayerKnightView(
      () => ({ image, width: 1122, height: 1402 }),
      () => ({ row: 9, frame: 7, position: state.position }),
    );
    view.draw(state, renderer);
    expect(renderer.calls.find((call) => call.op === 'drawSprite')).toEqual({
      op: 'drawSprite',
      args: [
        {
          image,
          source: { x: 963, y: 1242, width: 133, height: 138 },
          destination: { x: 6, y: 20 - (120 / 133) * 8, width: 8, height: (138 / 133) * 8 },
        },
      ],
    });
    expect(state.entity.transform?.radius).toBe(0.5);
    renderer.calls.length = 0;
    view.draw({ ...state, entity: { ...state.entity, team: 'dark' } }, renderer);
    expect(renderer.calls[0]).toMatchObject({ op: 'drawWorldGlyph' });
  });

  it('keeps other heroes and unloaded art on their existing fallback', () => {
    const renderer = new RecordingRenderer();
    const view = new PlayerKnightView(
      () => null,
      () => ({ row: 0, frame: 0, position: null }),
    );
    view.draw(state, renderer);
    expect(renderer.calls.some((call) => call.op === 'drawSprite')).toBe(false);
    const loaded = new PlayerKnightView(
      () => ({ image, width: 800, height: 1000 }),
      () => ({ row: 0, frame: 0, position: null }),
    );
    loaded.draw({ ...state, isFocused: false }, renderer);
    expect(renderer.calls.some((call) => call.op === 'drawSprite')).toBe(false);
  });
});
