import { describe, expect, it } from 'vitest';

import { TickRate } from './TickRate';

describe('TickRate', () => {
  it('rounds to the nearest tick and never returns less than one', () => {
    expect(new TickRate(30).toTicks(0.7)).toBe(21);
    expect(new TickRate(1).toTicks(1.5)).toBe(2);
    expect(new TickRate(30).toTicks(0.001)).toBe(1);
  });
});
