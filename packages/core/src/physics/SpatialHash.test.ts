import { describe, expect, it } from 'vitest';

import { SeededRandom } from '../utils/SeededRandom';
import { SpatialHash } from './SpatialHash';

const near = (hash: SpatialHash, x: number, y: number, radius: number): number[] => {
  const found: number[] = [];
  hash.forEachNear(x, y, radius, (index) => found.push(index));
  return found.sort((a, b) => a - b);
};

describe('SpatialHash', () => {
  it('finds every point within the radius, as a brute-force scan does', () => {
    const rng = new SeededRandom(7);
    const hash = new SpatialHash(100, 60, 4);
    const points = Array.from({ length: 1000 }, () => ({
      x: rng.nextFloat() * 100,
      y: rng.nextFloat() * 60,
    }));
    points.forEach((point, index) => {
      hash.insert(index, point.x, point.y);
    });

    for (const probe of points.slice(0, 50)) {
      const radius = 4;
      const exact = points
        .map((point, index) => ({ index, gap: Math.hypot(point.x - probe.x, point.y - probe.y) }))
        .filter(({ gap }) => gap <= radius)
        .map(({ index }) => index);
      const candidates = near(hash, probe.x, probe.y, radius);
      expect(candidates).toEqual(expect.arrayContaining(exact));
    }
  });

  it('puts points outside the world into the edge cells and forgets everything on clear', () => {
    const hash = new SpatialHash(10, 10, 5);
    hash.insert(0, -3, -3);
    hash.insert(1, 50, 50);

    expect(near(hash, 0, 0, 1)).toEqual([0]);
    expect(near(hash, 10, 10, 1)).toEqual([1]);

    hash.clear();
    expect(near(hash, 0, 0, 20)).toEqual([]);
  });

  it('visits in the same order for the same inserts', () => {
    const fill = (): number[] => {
      const hash = new SpatialHash(20, 20, 2);
      [3, 1, 4, 1.5, 9, 2.6].forEach((x, index) => {
        hash.insert(index, x, 5);
      });
      const order: number[] = [];
      hash.forEachNear(4, 5, 6, (index) => order.push(index));
      return order;
    };
    expect(fill()).toEqual(fill());
  });

  it('rejects a size that is not positive', () => {
    expect(() => new SpatialHash(0, 10, 1)).toThrow('width');
    expect(() => new SpatialHash(10, 10, Number.NaN)).toThrow('cellSize');
  });
});
