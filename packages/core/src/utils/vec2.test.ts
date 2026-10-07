import { describe, expect, it } from 'vitest';

import { SeededRandom } from './SeededRandom';
import { add, dot, length, normalize, scale, sub } from './vec2';

describe('vec2', () => {
  it('computes small known cases', () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: -4 })).toEqual({ x: 4, y: -2 });
    expect(sub({ x: 1, y: 2 }, { x: 3, y: -4 })).toEqual({ x: -2, y: 6 });
    expect(scale({ x: 1, y: -2 }, 3)).toEqual({ x: 3, y: -6 });
    expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
    expect(length({ x: 3, y: 4 })).toBe(5);
    expect(normalize({ x: 0, y: -5 })).toEqual({ x: 0, y: -1 });
  });

  it('normalizes the zero vector to zero instead of NaN', () => {
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('keeps the algebraic identities for 1,000 seeded vectors', () => {
    const rng = new SeededRandom(1);
    const coordinate = (): number => rng.nextFloat() * 2000 - 1000;
    for (let index = 0; index < 1000; index += 1) {
      const a = { x: coordinate(), y: coordinate() };
      const b = { x: coordinate(), y: coordinate() };
      const factor = coordinate() / 100;
      const roundTrip = sub(add(a, b), b);
      expect(roundTrip.x).toBeCloseTo(a.x, 9);
      expect(roundTrip.y).toBeCloseTo(a.y, 9);
      expect(length(scale(a, factor))).toBeCloseTo(Math.abs(factor) * length(a), 6);
      expect(dot(a, a)).toBeCloseTo(length(a) ** 2, 6);
      expect(dot(a, b)).toBe(dot(b, a));
      expect(length(normalize(a))).toBeCloseTo(1, 12);
    }
  });
});
