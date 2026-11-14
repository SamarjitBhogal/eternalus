import { describe, expect, it } from 'vitest';
import { countdownTicks } from './countdownTicks';

describe('countdownTicks', () => {
  it('multiplies seconds by the tick rate', () => {
    expect(countdownTicks(10, 30)).toBe(300);
    expect(countdownTicks(60, 30)).toBe(1800);
  });

  it('is zero for a zero countdown', () => {
    expect(countdownTicks(0, 30)).toBe(0);
  });

  it('rounds a fractional result to a whole tick', () => {
    expect(countdownTicks(2.5, 30)).toBe(75);
    expect(countdownTicks(1.01, 30)).toBe(30);
    expect(countdownTicks(1.02, 30)).toBe(31);
  });

  it('rounds 1.2 and 1.5 ticks to 1 and 2, so every reader agrees on the tick (X57-F7)', () => {
    expect(countdownTicks(0.04, 30)).toBe(1);
    expect(countdownTicks(0.05, 30)).toBe(2);
  });
});
