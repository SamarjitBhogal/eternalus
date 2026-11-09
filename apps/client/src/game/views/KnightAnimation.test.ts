import { describe, expect, it } from 'vitest';
import { KnightAnimation } from './KnightAnimation';
import { KNIGHT_ACTIONS } from './KnightAnimation.constants';
import type { KnightAction } from './KnightAnimation.types';

describe('KnightAnimation', () => {
  it('idles and follows actual movement in all four directions, then stops', () => {
    const animation = new KnightAnimation();
    expect(animation.sample(0)).toEqual({ row: 0, frame: 0, position: null });
    animation.observe({ x: 0, y: 0 });
    for (const [x, y, row] of [
      [0, 1, 1],
      [0, 0, 2],
      [-1, 0, 3],
      [0, 0, 4],
    ] as const) {
      animation.observe({ x, y });
      expect(animation.sample(0.3).row).toBe(row);
    }
    animation.observe({ x: 0, y: 0 });
    expect(animation.sample(0.5).row).toBe(0);
    animation.observe(null);
    expect(animation.sample(1).position).toBeNull();
  });

  it('plays every action fully and returns to idle without crossing a cell boundary', () => {
    for (const name of Object.keys(KNIGHT_ACTIONS) as KnightAction[]) {
      const animation = new KnightAnimation();
      const clip = KNIGHT_ACTIONS[name];
      animation.play(name, 2);
      expect(animation.sample(2)).toMatchObject({ row: clip.row, frame: 0 });
      expect(animation.sample(2 + clip.seconds * 0.99)).toMatchObject({ row: clip.row, frame: 7 });
      expect(animation.sample(2 + clip.seconds + 0.01).row).toBe(0);
      expect(animation.sample(1).row).toBe(0);
    }
  });

  it('protects an ability from weapon hits and accepts the next swing after recovery', () => {
    const animation = new KnightAnimation();
    animation.play('ability-4', 0);
    animation.play('attack', 0.1);
    expect(animation.sample(0.2).row).toBe(9);
    animation.play('attack', 3);
    expect(animation.sample(3).row).toBe(5);
    animation.play('attack', 3.05);
    expect(animation.sample(3.05).frame).toBe(0);
    animation.play('ability-1', 3.1);
    expect(animation.sample(3.1).row).toBe(6);
  });
});
