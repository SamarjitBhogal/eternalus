import { describe, expect, it } from 'vitest';

import { ObjectPool } from './ObjectPool';

interface Hit {
  amount: number;
  target: object | null;
}

function hitPool(capacity: number): ObjectPool<Hit> {
  return new ObjectPool<Hit>(
    capacity,
    () => ({ amount: 0, target: null }),
    (hit) => {
      hit.amount = 0;
      hit.target = null;
    },
  );
}

describe('ObjectPool', () => {
  it('resets fields on acquire', () => {
    const pool = hitPool(1);
    const hit = pool.acquire();
    if (hit === undefined) throw new Error('expected an object');
    pool.release(hit);
    // A caller that wrongly writes to a released object: acquire still hands back a clean one.
    hit.amount = 99;
    hit.target = {};
    expect(pool.acquire()).toEqual({ amount: 0, target: null });
  });

  it('nulls references on release', () => {
    const pool = hitPool(1);
    const hit = pool.acquire();
    if (hit === undefined) throw new Error('expected an object');
    hit.amount = 45;
    hit.target = {};
    pool.release(hit);
    expect(hit).toEqual({ amount: 0, target: null });
  });

  it('reuses the same objects and allocates none after construction', () => {
    const pool = hitPool(2);
    const first = pool.acquire();
    const second = pool.acquire();
    if (first === undefined || second === undefined) throw new Error('expected objects');
    pool.release(first);
    pool.release(second);
    const again = [pool.acquire(), pool.acquire()];
    // Identity, not shape: a freshly allocated look-alike must fail.
    expect(again.includes(first)).toBe(true);
    expect(again.includes(second)).toBe(true);
  });

  it('rejects an object it did not make, without resetting it', () => {
    const pool = hitPool(1);
    const stranger: Hit = { amount: 7, target: null };

    expect(() => {
      pool.release(stranger);
    }).toThrow('does not belong');
    expect(stranger.amount).toBe(7);
    expect(pool.available).toBe(1);
  });

  it('returns undefined when every object is in use', () => {
    const pool = hitPool(1);
    pool.acquire();
    expect(pool.available).toBe(0);
    expect(pool.acquire()).toBeUndefined();
  });

  it('rejects a double release', () => {
    const pool = hitPool(1);
    const hit = pool.acquire();
    if (hit === undefined) throw new Error('expected an object');
    pool.release(hit);
    expect(() => {
      pool.release(hit);
    }).toThrow('released twice');
  });

  it.each([0, -1, 2.5])('rejects capacity %s', (capacity) => {
    expect(() => hitPool(capacity)).toThrow(RangeError);
  });
});
