import { describe, expect, it } from 'vitest';

import { SeededRandom } from '../utils/SeededRandom';
import { SpatialHash } from './SpatialHash';

const positionsOf = (points: readonly { x: number; y: number }[]): Float64Array =>
  Float64Array.from(points.flatMap(({ x, y }) => [x, y]));

const query = (hash: SpatialHash, x: number, y: number, radius: number, size = 2000) => {
  const out = new Int32Array(size);
  return [...out.subarray(0, hash.queryCircle(x, y, radius, out))];
};

describe('SpatialHash', () => {
  it('returns exactly the points within the radius, ascending, as a brute-force scan does', () => {
    const rng = new SeededRandom(7);
    const hash = new SpatialHash(100, 60, 4);
    const points = Array.from({ length: 1000 }, () => ({
      x: rng.nextFloat() * 100,
      y: rng.nextFloat() * 60,
    }));
    hash.rebuild(positionsOf(points), points.length);

    for (const probe of points.slice(0, 50)) {
      const exact = points
        .map((point, index) => ({ index, gap: Math.hypot(point.x - probe.x, point.y - probe.y) }))
        .filter(({ gap }) => gap <= 4)
        .map(({ index }) => index);
      expect(query(hash, probe.x, probe.y, 4)).toEqual(exact);
    }
  });

  it('puts points outside the world into the edge cells and forgets old points on rebuild', () => {
    const hash = new SpatialHash(10, 10, 5);
    hash.rebuild(
      positionsOf([
        { x: -3, y: -3 },
        { x: 50, y: 50 },
      ]),
      2,
    );

    expect(query(hash, 0, 0, 5)).toEqual([0]);
    expect(query(hash, 49, 49, 2)).toEqual([1]);

    hash.rebuild(positionsOf([{ x: 9, y: 9 }]), 1);
    expect(query(hash, 0, 0, 20)).toEqual([0]);
    expect(query(hash, 0, 0, 1)).toEqual([]);
  });

  it('stops at the end of the output buffer', () => {
    const hash = new SpatialHash(10, 10, 5);
    hash.rebuild(
      positionsOf([
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ]),
      3,
    );

    expect(hash.queryCircle(1, 1, 1, new Int32Array(2))).toBe(2);
  });

  it('rejects a size that is not positive', () => {
    expect(() => new SpatialHash(0, 10, 1)).toThrow('width');
    expect(() => new SpatialHash(10, 10, Number.NaN)).toThrow('cellSize');
  });

  it('costs what its points cost, not what the world costs: a vast world with three points', () => {
    // 10^6 × 10^6 cells: a per-cell layout could not even be allocated.
    const hash = new SpatialHash(1_000_000, 1_000_000, 1);
    hash.rebuild(Float64Array.from([10, 10, 10.5, 10, 999_999, 999_999]), 3);
    const out = new Int32Array(3);

    expect(hash.queryCircle(10, 10, 1, out)).toBe(2);
    expect([...out.subarray(0, 2)]).toEqual([0, 1]);
    expect(hash.queryCircle(999_999, 999_999, 1, out)).toBe(1);
    expect(out[0]).toBe(2);
  });

  it('refuses more points than its keys can hold exactly', () => {
    const hash = new SpatialHash(1e9, 1e9, 1);

    expect(() => {
      hash.rebuild(new Float64Array(20_000), 10_000);
    }).toThrow(RangeError);
  });
});
