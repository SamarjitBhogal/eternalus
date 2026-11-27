import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { AirborneView } from './AirborneView';
import { AIRBORNE_SHADOW_COLOR } from './AirborneView.constants';
import type { EntityDrawState, EntityView } from './EntityView.types';

const legend = (height: number | null): EntitySnapshot => ({
  id: 'entity-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 4, y: 10, radius: 0.5, facing: { x: 1, y: 0 } },
  health: { current: 600, max: 600 },
  jump: height === null ? null : { height },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem: null,
});

/** The Legend's draw state at (4, 10); `height` is the interpolated one `EntityLayer` gives. */
const stateOf = (entity: EntitySnapshot): EntityDrawState => ({
  entity,
  position: { x: 4, y: 10 },
  facing: { x: 1, y: 0 },
  height: entity.jump?.height ?? 0,
  isFocused: false,
});

/** Records where it was asked to draw and returns `top`. */
class StubView implements EntityView {
  public readonly drawnAt: WorldPoint[] = [];

  public readonly minimapLayer = 3;

  public constructor(private readonly top: number | undefined) {}

  public draw(state: EntityDrawState): number | undefined {
    this.drawnAt.push(state.position);
    return this.top;
  }

  public drawMinimap(state: EntityDrawState): void {
    this.drawnAt.push(state.position);
  }

  public visualRadiusOf(): number {
    return 2.6;
  }
}

describe('AirborneView', () => {
  it.each([null, 0])('draws a Legend with jump %s like the wrapped view, with no shadow', (h) => {
    const inner = new StubView(7);
    const renderer = new RecordingRenderer();

    const top = new AirborneView(inner).draw(stateOf(legend(h)), renderer);

    expect(top).toBe(7);
    expect(inner.drawnAt).toEqual([{ x: 4, y: 10 }]);
    expect(renderer.calls).toEqual([]);
  });

  it('draws a ground shadow, then the Legend raised by its height (DEC-390)', () => {
    const inner = new StubView(7);
    const renderer = new RecordingRenderer();

    const top = new AirborneView(inner).draw(stateOf(legend(1.5)), renderer);

    expect(renderer.calls).toEqual([
      {
        op: 'drawWorldGlyph',
        args: [{ shape: 'dot', size: 5.2 }, { x: 4, y: 10 }, AIRBORNE_SHADOW_COLOR],
      },
    ]);
    expect(inner.drawnAt).toEqual([{ x: 4, y: 8.5 }]);
    expect(top).toBe(8.5);
  });

  it('lifts by the interpolated height of the draw state, not the snapshot height', () => {
    const inner = new StubView(7);

    const top = new AirborneView(inner).draw(
      { ...stateOf(legend(1.5)), height: 0.5 },
      new RecordingRenderer(),
    );

    expect(inner.drawnAt).toEqual([{ x: 4, y: 9.5 }]);
    expect(top).toBe(7.5);
  });

  it('lifts the health bar from the artwork radius when the wrapped view reports no top', () => {
    const top = new AirborneView(new StubView(undefined)).draw(
      stateOf(legend(1.5)),
      new RecordingRenderer(),
    );

    expect(top).toBe(2.6 + 1.5);
  });

  it('keeps the wrapped view on the mini map, at the ground position', () => {
    const inner = new StubView(7);
    const view = new AirborneView(inner);

    view.drawMinimap(stateOf(legend(1.5)), new RecordingRenderer());

    expect(inner.drawnAt).toEqual([{ x: 4, y: 10 }]);
    expect(view.minimapLayer).toBe(3);
    expect(view.visualRadiusOf(legend(1.5))).toBe(2.6);
  });
});
