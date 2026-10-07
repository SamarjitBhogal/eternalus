import { describe, expect, it } from 'vitest';

import { Health } from './Health';

describe('Health', () => {
  it('starts full and loses health from damage', () => {
    const health = new Health(100);

    expect(health.current).toBe(100);
    expect(health.applyDamage(30)).toBe(30);
    expect(health.current).toBe(70);
    expect(health.isDead).toBe(false);
  });

  it('clamps over-kill damage at 0 and reports only what was dealt', () => {
    const health = new Health(50);

    expect(health.applyDamage(80)).toBe(50);
    expect(health.current).toBe(0);
    expect(health.isDead).toBe(true);
  });

  it('heals up to max and reports only what was restored', () => {
    const health = new Health(100);
    health.applyDamage(10);

    expect(health.heal(25)).toBe(10);
    expect(health.current).toBe(100);
  });

  it('rejects invalid max, damage and heal values', () => {
    expect(() => new Health(0)).toThrow('max must be a positive number');

    const health = new Health(10);
    expect(() => health.applyDamage(-1)).toThrow('damage must be a finite number');
    expect(() => health.heal(Number.NaN)).toThrow('heal must be a finite number');
    expect(health.current).toBe(10);
  });
});
