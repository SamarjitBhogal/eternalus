import { describe, expect, it } from 'vitest';

import { Condition } from './Condition';

describe('Condition', () => {
  it('succeeds when its test holds and fails otherwise', () => {
    const isAbove = new Condition<number>((value) => value > 3);

    expect(isAbove.tick(4)).toBe('success');
    expect(isAbove.tick(2)).toBe('failure');
  });
});
