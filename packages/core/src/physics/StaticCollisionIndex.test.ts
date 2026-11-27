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

describe('StaticCollisionIndex add and remove', () => {
  const square = (id: string, x: number) => ({
    id,
    polygon: [
      { x, y: 0 },
      { x: x + 4, y: 0 },
      { x: x + 4, y: 1 },
      { x, y: 1 },
    ],
  });
  const ids = (index: StaticCollisionIndex) =>
    [...index.query({ x: 0, y: 0, width: 100, height: 1 })].map(({ id }) => id);

  it('blocks with a shape added during the match until its id is removed, then can add it again', () => {
    const index = new StaticCollisionIndex([square('rock', 0)]);

    index.add(square('placed', 40));
    expect(ids(index)).toEqual(['rock', 'placed']);
    index.remove('placed');
    expect(ids(index)).toEqual(['rock']);
    index.add(square('placed', 40));
    expect(ids(index)).toEqual(['rock', 'placed']);
  });

  it('removes every shape of an id and leaves the others in their order', () => {
    const index = new StaticCollisionIndex([square('a', 0), square('b', 10), square('a', 20)]);

    index.remove('a');
    expect(ids(index)).toEqual(['b']);
    index.remove('unknown');
    expect(ids(index)).toEqual(['b']);
  });
});
