import type { EntitySnapshot, SwingSnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { colorWithAlpha } from './colorWithAlpha';
import type { EntityDrawState } from './EntityView.types';
import { SWING_WEDGE } from './entityViews.constants';
import { drawSwingWedge } from './swingWedge';

const AT = { x: 10, y: 20 };
const EAST = { x: 1, y: 0 };
const SWING_TICK = 40;
/** A quarter-circle sweep to the east, 3 m out. */
const SWING: SwingSnapshot = { atTick: SWING_TICK, direction: EAST, radius: 3, arcDegrees: 90 };

const legend = (swing?: SwingSnapshot): EntitySnapshot => ({
  id: 'legend-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5, facing: EAST },
  health: { current: 600, max: 600 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  statuses: null,
  projectile: null,
  swing: swing ?? null,
});

const draw = (tick: number, swing?: SwingSnapshot): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  const state: EntityDrawState = {
    entity: legend(swing),
    position: AT,
    facing: EAST,
    tick,
    isFocused: false,
  };
  drawSwingWedge(state, renderer);
  return renderer;
};

describe('drawSwingWedge', () => {
  it('fills a wedge from the position over the arc at the swing radius', () => {
    const renderer = draw(SWING_TICK, SWING);

    expect(renderer.calls).toHaveLength(1);
    const call = renderer.calls[0];
    if (call?.op !== 'fillPolygon') throw new Error('expected a fillPolygon call');
    const [points, color] = call.args;
    expect(points).toHaveLength(SWING_WEDGE.arcSegments + 2);
    expect(points[0]).toEqual(AT);
    const first = points[1];
    const last = points.at(-1);
    const turn = Math.PI / 4;
    expect(first?.x).toBeCloseTo(AT.x + Math.cos(-turn) * 3);
    expect(first?.y).toBeCloseTo(AT.y + Math.sin(-turn) * 3);
    expect(last?.x).toBeCloseTo(AT.x + Math.cos(turn) * 3);
    expect(last?.y).toBeCloseTo(AT.y + Math.sin(turn) * 3);
    expect(color).toBe(colorWithAlpha(SWING_WEDGE.color, SWING_WEDGE.startOpacity));
  });

  it('turns the arc with the swing direction', () => {
    const renderer = draw(SWING_TICK, { ...SWING, direction: { x: 0, y: 1 } });

    const call = renderer.calls[0];
    if (call?.op !== 'fillPolygon') throw new Error('expected a fillPolygon call');
    const middle = call.args[0][1 + SWING_WEDGE.arcSegments / 2];
    expect(middle?.x).toBeCloseTo(AT.x);
    expect(middle?.y).toBeCloseTo(AT.y + 3);
  });

  it('fades linearly to nothing over the fade window', () => {
    const colors = [0, 1, SWING_WEDGE.fadeTicks - 1].map((age) => {
      const call = draw(SWING_TICK + age, SWING).calls[0];
      return call?.op === 'fillPolygon' ? call.args[1] : null;
    });

    const opacity = (age: number): number =>
      SWING_WEDGE.startOpacity * (1 - age / SWING_WEDGE.fadeTicks);
    expect(colors).toEqual([
      colorWithAlpha(SWING_WEDGE.color, opacity(0)),
      colorWithAlpha(SWING_WEDGE.color, opacity(1)),
      colorWithAlpha(SWING_WEDGE.color, opacity(SWING_WEDGE.fadeTicks - 1)),
    ]);
    expect(opacity(1)).toBeLessThan(opacity(0));
  });

  it('draws nothing at the end of the window, after it, or without a swing', () => {
    expect(draw(SWING_TICK + SWING_WEDGE.fadeTicks, SWING).calls).toEqual([]);
    expect(draw(SWING_TICK + SWING_WEDGE.fadeTicks + 5, SWING).calls).toEqual([]);
    expect(draw(SWING_TICK).calls).toEqual([]);
  });
});
