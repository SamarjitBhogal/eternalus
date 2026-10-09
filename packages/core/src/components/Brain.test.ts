import { describe, expect, it } from 'vitest';

import { Brain } from './Brain';

describe('Brain', () => {
  it('keeps the controller id', () => {
    expect(new Brain('follow-leader').controllerId).toBe('follow-leader');
  });

  it('rejects an empty controller id', () => {
    expect(() => new Brain('')).toThrow('must not be empty');
  });
});
