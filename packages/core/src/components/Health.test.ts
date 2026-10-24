import { describe, expect, it } from 'vitest';

import { Health } from './Health';

describe('Health', () => {
  it('starts full and loses health from damage', () => {
    const health = new Health(100);

    expect(health.current).toBe(100);
    expect(health.applyDamage(30)).toEqual({ toShields: 0, toBase: 30, overflow: 0 });
    expect(health.current).toBe(70);
    expect(health.isDead).toBe(false);
  });

  it('clamps over-kill damage at 0 and reports the overflow', () => {
    const health = new Health(50);

    expect(health.applyDamage(80)).toEqual({ toShields: 0, toBase: 50, overflow: 30 });
    expect(health.current).toBe(0);
    expect(health.isDead).toBe(true);
  });

  it('heals up to max and reports only what was restored', () => {
    const health = new Health(100);
    health.applyDamage(10);

    expect(health.heal(25)).toBe(10);
    expect(health.current).toBe(100);
  });

  it('matches the worked example: 1000 base + 3 bars of 1500 = 5500', () => {
    const health = new Health(1000);
    health.addShield('buff-tower-1', 1500);
    health.addShield('buff-tower-2', 1500);
    health.addShield('buff-tower-3', 1500);

    expect(health.total).toBe(5500);

    // 2000 damage empties the oldest bar and takes 500 from the next; base is untouched.
    expect(health.applyDamage(2000)).toEqual({ toShields: 2000, toBase: 0, overflow: 0 });
    expect(health.shields.map((bar) => bar.current)).toEqual([0, 1000, 1500]);
    expect(health.current).toBe(1000);
    expect(health.total).toBe(3500);
  });

  it('drops a bar when its tower dies without touching base or the other bars', () => {
    const health = new Health(100);
    health.addShield('buff-tower-1', 150);
    health.addShield('buff-tower-2', 150);
    health.applyDamage(50);

    health.removeShield('buff-tower-1');
    health.removeShield('not-a-source');

    expect(health.shields).toEqual([{ sourceId: 'buff-tower-2', current: 150, max: 150 }]);
    expect(health.current).toBe(100);
  });

  it('never heals shield bars', () => {
    const health = new Health(100);
    health.addShield('buff-tower-1', 50);
    health.applyDamage(70);

    expect(health.heal(100)).toBe(20);
    expect(health.shields[0]?.current).toBe(0);
  });

  it('never lets callers change a shield bar through the shields list', () => {
    const health = new Health(100);
    health.addShield('buff-tower-1', 50);

    Object.assign(health.shields[0] ?? {}, { current: 9999 });

    expect(health.total).toBe(150);
  });

  it('rejects invalid values and a second bar from the same source', () => {
    expect(() => new Health(0)).toThrow('max must be a positive number');

    const health = new Health(10);
    expect(() => health.applyDamage(-1)).toThrow('damage must be a finite number');
    expect(() => health.heal(Number.NaN)).toThrow('heal must be a finite number');
    expect(() => {
      health.addShield('buff-tower-1', 0);
    }).toThrow('shield max must be a positive number');

    health.addShield('buff-tower-1', 5);
    expect(() => {
      health.addShield('buff-tower-1', 5);
    }).toThrow('already has a shield from "buff-tower-1"');
    expect(health.total).toBe(15);
  });

  it('keeps shield bars in source id order, whatever order the towers granted them', () => {
    const health = new Health(100);
    health.addShield('buff-tower-3', 10);
    health.addShield('buff-tower-1', 10);
    health.addShield('buff-tower-2', 10);

    health.applyDamage(15);

    expect(health.shields.map(({ sourceId, current }) => [sourceId, current])).toEqual([
      ['buff-tower-1', 0],
      ['buff-tower-2', 5],
      ['buff-tower-3', 10],
    ]);
  });

  it('keeps towers in creation order, so entity-10 comes after entity-9 (07 §2, DEC-20)', () => {
    const health = new Health(100);
    health.addShield('entity-10', 10);
    health.addShield('entity-9', 10);

    health.applyDamage(5);

    expect(health.shields.map(({ sourceId, current }) => [sourceId, current])).toEqual([
      ['entity-9', 5],
      ['entity-10', 10],
    ]);
  });

  it('raises only the cap (the caller heals, O3/O4), and rejects a negative raise', () => {
    const pool = new Health(100);
    pool.raiseMax(20);

    expect(pool.max).toBe(120);
    expect(pool.current).toBe(100);
    expect(() => {
      pool.raiseMax(-1);
    }).toThrow();
  });

  it('does not revive a dead entity when its max is raised', () => {
    const health = new Health(100);
    health.applyDamage(100);
    health.raiseMax(20);

    expect(health.max).toBe(120);
    expect(health.isDead).toBe(true);
  });
});
