import { describe, expect, it } from 'vitest';

import type { MapDefinition } from '../content/maps/maps.types';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import type { Polygon } from '../utils/geometry.types';
import { RuntimeWalls } from './RuntimeWalls';
import { WorldMap } from './WorldMap';

/** An empty 40 x 20 map. */
const EMPTY_MAP: MapDefinition = {
  id: 'empty',
  displayName: 'Empty',
  width: 40,
  height: 20,
  seed: 0,
  lanes: [],
  terrain: [],
  features: [],
};

/** An upright rectangle from (`x`, `y`), `width` by `height`. */
const box = (x: number, y: number, width: number, height: number): Polygon => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

/** Runtime walls over a fresh index holding one rock at x = 0 to 2, and the cells each report named. */
const walls = () => {
  const index = new StaticCollisionIndex([{ id: 'rock', polygon: box(0, 0, 2, 2) }]);
  const grid = WorldMap.fromDefinition(EMPTY_MAP, 2, () => false);
  const reports: (readonly number[])[] = [];
  const runtime = new RuntimeWalls(index, grid, { x: 0, y: 0, width: 40, height: 20 }, (cells) => {
    reports.push(cells);
  });
  const blockers = () =>
    [...index.query({ x: 0, y: 0, width: 40, height: 20 })].map(({ id }) => id);
  return { runtime, grid, reports, blockers };
};

describe('RuntimeWalls', () => {
  it('adds a body to the index and the grid, and its removal undoes both', () => {
    const { runtime, grid, reports, blockers } = walls();

    runtime.add('entity-1', [box(10, 10, 4, 1)]);
    expect(blockers()).toEqual(['rock', 'entity-1']);
    expect(grid.isWalkableAt(11, 10.5)).toBe(false);
    expect(reports).toHaveLength(1);

    runtime.remove('entity-1');
    expect(blockers()).toEqual(['rock']);
    expect(grid.isWalkableAt(11, 10.5)).toBe(true);
    expect(reports).toEqual([reports[0], reports[0]]);
  });

  it('keeps a cell blocked while another body still covers it', () => {
    const { runtime, grid } = walls();

    runtime.add('entity-1', [box(10, 10, 4, 1)]);
    runtime.add('entity-2', [box(10, 10, 1, 4)]);
    runtime.remove('entity-1');

    expect(grid.isWalkableAt(10.5, 10.5)).toBe(false);
    expect(grid.isWalkableAt(13, 10.5)).toBe(true);
  });

  it('ignores the removal of an id it never added, and refuses to add one twice', () => {
    const { runtime, reports, blockers } = walls();

    runtime.remove('rock');
    expect(blockers()).toEqual(['rock']);
    expect(reports).toHaveLength(0);
    runtime.add('entity-1', [box(10, 10, 4, 1)]);
    expect(() => {
      runtime.add('entity-1', [box(20, 10, 4, 1)]);
    }).toThrow('already blocks');
  });

  it('finds an outline blocked by a wall, a placed body or the map edge, and clear elsewhere', () => {
    const { runtime } = walls();
    runtime.add('entity-1', [box(10, 10, 4, 1)]);

    expect(runtime.isBlocked(box(1, 1, 4, 1))).toBe(true);
    expect(runtime.isBlocked(box(12, 10.5, 4, 1))).toBe(true);
    expect(runtime.isBlocked(box(38, 5, 4, 1))).toBe(true);
    expect(runtime.isBlocked(box(20, 5, 4, 1))).toBe(false);
  });
});
