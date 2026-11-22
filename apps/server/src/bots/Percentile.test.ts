import { describe, expect, it } from 'vitest';
import { Percentile } from './Percentile';

describe('Percentile', () => {
  it('is null without values', () => {
    expect(new Percentile().of([], 50)).toBeNull();
  });

  it('takes the nearest rank of unsorted values without changing them', () => {
    const values = [40, 10, 30, 20];
    expect(new Percentile().of(values, 50)).toBe(20);
    expect(new Percentile().of(values, 99)).toBe(40);
    expect(new Percentile().of(values, 0)).toBe(10);
    expect(values).toEqual([40, 10, 30, 20]);
  });
});
