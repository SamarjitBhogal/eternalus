import { describe, expect, it } from 'vitest';

import { atan2, cos, exp, pow, sin, sqrt } from './deterministicMath';

describe('deterministicMath', () => {
  it('computes the usual values', () => {
    expect(sin(Math.PI / 2)).toBe(1);
    expect(cos(0)).toBe(1);
    expect(atan2(1, 1)).toBeCloseTo(Math.PI / 4, 15);
    expect(sqrt(9)).toBe(3);
    expect(pow(2, 10)).toBe(1024);
    expect(exp(0)).toBe(1);
  });

  it('gives bit-identical results run to run', () => {
    const run = (): number[] =>
      Array.from({ length: 1000 }, (_, index) => {
        const angle = index * 0.0123;
        return (
          sin(angle) + cos(angle) * atan2(index, 7) - pow(1.001, index) + sqrt(index) * exp(-angle)
        );
      });
    expect(run()).toEqual(run());
  });
});
