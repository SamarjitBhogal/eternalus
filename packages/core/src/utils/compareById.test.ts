import { describe, expect, it } from 'vitest';

import { compareById } from './compareById';

describe('compareById', () => {
  it('orders ids as strings, never as numbers', () => {
    expect(['entity-9', 'entity-10', 'entity-1', 'entity-10'].sort(compareById)).toEqual([
      'entity-1',
      'entity-10',
      'entity-10',
      'entity-9',
    ]);
    expect(compareById('a', 'a')).toBe(0);
  });
});
