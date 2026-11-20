import { describe, expect, it } from 'vitest';
import { ConnectionLimiter } from './ConnectionLimiter';

describe('ConnectionLimiter', () => {
  it('refuses a connection past the per-IP cap but not another IP', () => {
    const limiter = new ConnectionLimiter(10, 2);
    expect(limiter.tryAcquire('a')).toBe(true);
    expect(limiter.tryAcquire('a')).toBe(true);
    expect(limiter.tryAcquire('a')).toBe(false);
    expect(limiter.tryAcquire('b')).toBe(true);
  });

  it('refuses a connection past the total cap', () => {
    const limiter = new ConnectionLimiter(2, 5);
    expect(limiter.tryAcquire('a')).toBe(true);
    expect(limiter.tryAcquire('b')).toBe(true);
    expect(limiter.tryAcquire('c')).toBe(false);
  });

  it('frees a slot on release and ignores a release it never granted', () => {
    const limiter = new ConnectionLimiter(2, 1);
    limiter.release('a');
    expect(limiter.tryAcquire('a')).toBe(true);
    expect(limiter.tryAcquire('a')).toBe(false);
    limiter.release('a');
    expect(limiter.tryAcquire('a')).toBe(true);
    expect(limiter.tryAcquire('b')).toBe(true);
    expect(limiter.tryAcquire('c')).toBe(false);
  });

  it('keeps counting an IP that holds several slots after one release', () => {
    const limiter = new ConnectionLimiter(10, 2);
    limiter.tryAcquire('a');
    limiter.tryAcquire('a');
    limiter.release('a');
    expect(limiter.tryAcquire('a')).toBe(true);
    expect(limiter.tryAcquire('a')).toBe(false);
  });
});
