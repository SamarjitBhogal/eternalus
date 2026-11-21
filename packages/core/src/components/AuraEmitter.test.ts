import { describe, expect, it } from 'vitest';

import { AuraEmitter } from './AuraEmitter';

describe('AuraEmitter', () => {
  it('keeps its radius', () => {
    expect(new AuraEmitter(12).radius).toBe(12);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects the radius %s', (radius) => {
    expect(() => new AuraEmitter(radius)).toThrow('positive finite radius');
  });
});
