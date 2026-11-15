import { describe, expect, it } from 'vitest';

import { TickRate } from './TickRate';

describe('TickRate', () => {
  it('rounds to the nearest tick and never returns less than one', () => {
    expect(new TickRate(30).toTicks(0.7)).toBe(21);
    expect(new TickRate(1).toTicks(1.5)).toBe(2);
    expect(new TickRate(30).toTicks(0.001)).toBe(1);
  });

  it('rounds to the nearest tick with no floor when 0 must stay 0', () => {
    expect(new TickRate(30).roundToTicks(0.7)).toBe(21);
    expect(new TickRate(30).roundToTicks(0)).toBe(0);
    expect(new TickRate(30).roundToTicks(0.001)).toBe(0);
    expect(new TickRate(30).roundToTicks(-1)).toBe(-30);
  });

  it('turns a rate per second into a rate per tick', () => {
    expect(new TickRate(30).perTick(0.06)).toBe(0.06 / 30);
    expect(new TickRate(10).perTick(3)).toBeCloseTo(0.3, 12);
    expect(new TickRate(30).perTick(0)).toBe(0);
  });
});
