import { describe, expect, it } from 'vitest';

import { Aether } from './Aether';

describe('Aether', () => {
  it('starts full', () => {
    const aether = new Aether(300);

    expect(aether.current).toBe(300);
    expect(aether.fraction).toBe(1);
    expect(aether.isEmpty).toBe(false);
  });

  it('spends what it can afford', () => {
    const aether = new Aether(100);

    expect(aether.canAfford(40)).toBe(true);
    aether.spend(40);
    expect(aether.current).toBe(60);
  });

  it('refuses to overspend and leaves the pool untouched', () => {
    const aether = new Aether(50);

    expect(aether.canAfford(80)).toBe(false);
    expect(() => {
      aether.spend(80);
    }).toThrow();
    expect(aether.current).toBe(50);
  });

  it('restores up to max and reports only what was restored', () => {
    const aether = new Aether(100);
    aether.spend(30);

    expect(aether.restore(50)).toBe(30);
    expect(aether.current).toBe(100);
  });

  it('empties exactly', () => {
    const aether = new Aether(20);
    aether.spend(20);

    expect(aether.isEmpty).toBe(true);
    expect(aether.fraction).toBe(0);
  });

  it('rejects a non-positive max', () => {
    expect(() => new Aether(0)).toThrow();
  });

  it('raises max and fills by the same amount, and rejects a negative raise', () => {
    const pool = new Aether(100);
    pool.raiseMax(20);

    expect(pool.max).toBe(120);
    expect(pool.current).toBe(120);
    expect(() => {
      pool.raiseMax(-1);
    }).toThrow();
  });
});
