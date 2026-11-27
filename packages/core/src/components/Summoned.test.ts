import { describe, expect, it } from 'vitest';

import { Summoned } from './Summoned';

describe('Summoned', () => {
  it('keeps the caster that placed its body', () => {
    expect(new Summoned('entity-4').ownerId).toBe('entity-4');
  });
});
