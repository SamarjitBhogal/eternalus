import { describe, expect, it } from 'vitest';

import { predictiveAim } from './predictiveAim';

const ORIGIN = { x: 0, y: 0 };

describe('predictiveAim', () => {
  it('aims at a still target', () => {
    expect(predictiveAim(ORIGIN, { x: 20, y: 5 }, { x: 0, y: 0 }, 1)).toEqual({ x: 20, y: 5 });
  });

  it('leads a moving target by its velocity times the flight time to it, then refines once', () => {
    // 20 m away, moving 1 m/tick across the line of fire, shot at 4 m/tick: the first guess is
    // 20 / 4 = 5 ticks ahead, at (20, 5); refined with the flight to it, sqrt(425) / 4 ticks.
    const refinedTime = Math.sqrt(20 * 20 + 5 * 5) / 4;

    expect(predictiveAim(ORIGIN, { x: 20, y: 0 }, { x: 0, y: 1 }, 4)).toEqual({
      x: 20,
      y: refinedTime,
    });
  });

  it('refines toward the true meeting point, which one step alone misses', () => {
    // Running straight away at 1 m/tick from 20 m, shot at 2 m/tick: they meet at 40 m.
    const aim = predictiveAim(ORIGIN, { x: 20, y: 0 }, { x: 1, y: 0 }, 2);
    const firstStep = 20 + 20 / 2;

    expect(aim).toEqual({ x: 20 + firstStep / 2, y: 0 });
    expect(Math.abs(40 - aim.x)).toBeLessThan(Math.abs(40 - firstStep));
  });

  it('measures the flight from the origin, wherever it is', () => {
    expect(predictiveAim({ x: 10, y: 10 }, { x: 10, y: 30 }, { x: -1, y: 0 }, 5)).toEqual({
      x: 10 - Math.sqrt(16 + 400) / 5,
      y: 30,
    });
  });

  it('adds the delay to every flight time, so an arc shot that lands at the aim point meets the target', () => {
    // 20 m away, moving 1 m/tick across, shot at 4 m/tick, 3 ticks before it moves: the first
    // guess is 20 / 4 + 3 = 8 ticks ahead, at (20, 8); refined with the flight to it.
    const refinedTime = Math.sqrt(20 * 20 + 8 * 8) / 4 + 3;

    expect(predictiveAim(ORIGIN, { x: 20, y: 0 }, { x: 0, y: 1 }, 4, 3)).toEqual({
      x: 20,
      y: refinedTime,
    });
  });
});
