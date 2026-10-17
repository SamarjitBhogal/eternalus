import { describe, expect, it } from 'vitest';

import { SpaceIndex } from './SpaceIndex';

const fill = (index: SpaceIndex, points: readonly [string, number, number][]) => {
  index.begin(points.length);
  for (const [id, x, y] of points) {
    index.add(id, x, y);
  }
  index.commit();
};

describe('SpaceIndex', () => {
  it('maps ids to indexes and back, and finds them by circle', () => {
    const index = new SpaceIndex(20, 20, 2);
    fill(index, [
      ['a', 1, 1],
      ['b', 2, 1],
      ['c', 15, 15],
    ]);
    const out = new Int32Array(3);

    expect(index.count).toBe(3);
    expect(index.indexOf('c')).toBe(2);
    expect(index.idAt(1)).toBe('b');
    expect([...out.subarray(0, index.queryCircle(1, 1, 1.5, out))]).toEqual([0, 1]);
    expect([...index.positions.subarray(0, 2)]).toEqual([1, 1]);
  });

  it('forgets the last refill and grows its buffer for a bigger one', () => {
    const index = new SpaceIndex(20, 20, 2);
    fill(index, [['a', 1, 1]]);
    const many = Array.from({ length: 50 }, (_, at): [string, number, number] => [
      `u${String(at)}`,
      at % 20,
      5,
    ]);

    fill(index, many);

    expect(index.count).toBe(50);
    expect(index.indexOf('a')).toBeUndefined();
    expect(index.idAt(49)).toBe('u49');
    expect(index.idAt(50)).toBe('');
  });
});
