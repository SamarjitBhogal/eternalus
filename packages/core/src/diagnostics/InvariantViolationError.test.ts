import { describe, expect, it } from 'vitest';

import { InvariantViolationError } from './InvariantViolationError';

describe('InvariantViolationError', () => {
  it('lists every violation with the tick and seed', () => {
    const error = new InvariantViolationError(
      [
        { invariantId: 'a', severity: 'error', message: 'A broke.', entityId: null, details: {} },
        { invariantId: 'b', severity: 'fatal', message: 'B broke.', entityId: 'x', details: {} },
      ],
      12,
      7,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('InvariantViolationError');
    expect(error.message).toBe('Invariant violated at tick 12 (seed 7): a: A broke.; b: B broke.');
    expect([error.tick, error.seed, error.violations.length]).toEqual([12, 7, 2]);
  });
});
