import { describe, expect, it } from 'vitest';
import { FakeClock } from '../time/FakeClock';
import { TokenBucket } from './TokenBucket';

describe('TokenBucket', () => {
  it('allows a burst up to capacity, then refuses', () => {
    const bucket = new TokenBucket(new FakeClock(), 3, 1);
    expect([bucket.tryTake(), bucket.tryTake(), bucket.tryTake(), bucket.tryTake()]).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('refills with time, never above capacity', () => {
    const clock = new FakeClock();
    const bucket = new TokenBucket(clock, 2, 2);
    bucket.tryTake();
    bucket.tryTake();
    expect(bucket.tryTake()).toBe(false);
    clock.advance(500);
    expect(bucket.tryTake()).toBe(true);
    expect(bucket.tryTake()).toBe(false);
    clock.advance(60_000);
    expect([bucket.tryTake(), bucket.tryTake(), bucket.tryTake()]).toEqual([true, true, false]);
  });
});
