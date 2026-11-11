import { describe, expect, it } from 'vitest';
import { StaticCollisionIndex } from './StaticCollisionIndex';

describe('StaticCollisionIndex', () => {
  it('deduplicates polygons crossing buckets, rejects distant candidates and removes destroyed owners', () => {
    const wall = {
      id: 'wall',
      polygon: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 2 },
        { x: 0, y: 2 },
      ],
    };
    const index = new StaticCollisionIndex([wall, { id: 'empty', polygon: [] }]);
    expect([...index.query({ x: 0, y: 0, width: 100, height: 5 })].map((p) => p.id)).toEqual([
      'wall',
    ]);
    expect(index.query({ x: 0, y: 20, width: 1, height: 1 }).size).toBe(0);
    expect(index.query({ x: 500, y: 500, width: 1, height: 1 }).size).toBe(0);
    index.remove('wall');
    expect(index.query({ x: 0, y: 0, width: 100, height: 5 }).size).toBe(0);
  });
});
