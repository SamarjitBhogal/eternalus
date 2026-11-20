import { describe, expect, it } from 'vitest';

import { assertNonNegativeFinite } from './assertNonNegativeFinite';
import { ContentValidationError } from './ContentValidationError';

describe('assertNonNegativeFinite', () => {
  it('accepts 0 and positive finite values', () => {
    expect(() => {
      assertNonNegativeFinite('things', [
        ['a', 0],
        ['b', 0.5],
        ['c', 120],
      ]);
    }).not.toThrow();
  });

  it('names every value that is negative or not finite', () => {
    expect(() => {
      assertNonNegativeFinite('things', [
        ['a x', -1],
        ['b x', 3],
        ['c x', Number.NaN],
        ['d x', Number.POSITIVE_INFINITY],
      ]);
    }).toThrow(
      new ContentValidationError('Invalid things: a x is -1 s; c x is NaN s; d x is Infinity s'),
    );
  });

  it('prints the unit it is given, for a rate per second', () => {
    expect(() => {
      assertNonNegativeFinite('rates', [['a x', -0.5]], 'per s');
    }).toThrow(new ContentValidationError('Invalid rates: a x is -0.5 per s'));
  });
});
