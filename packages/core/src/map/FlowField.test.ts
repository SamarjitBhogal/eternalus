import { describe, expect, it } from 'vitest';

import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
import { DIRECTION_COLS, DIRECTION_ROWS, NO_DIRECTION } from './FlowField.constants';
import { LaneFlowFields } from './LaneFlowFields';
import { WorldMap } from './WorldMap';

const fieldOf = () => {
  const grid = WorldMap.fromDefinition(BLOCKED_LANE_MAP, 5, () => false);
  const field = new LaneFlowFields(grid, BLOCKED_LANE_MAP, 20).field('lane-0', 'light');
  if (field === undefined) {
    throw new Error('no field');
  }
  return field;
};

describe('FlowField', () => {
  it('points toward the goal on open ground and around the block in front of it', () => {
    const field = fieldOf();
    const open = { x: 0, y: 0 };
    const front = { x: 0, y: 0 };

    expect(field.directionAt(90, 20, open)).toBe(true);
    expect(field.directionAt(47, 20, front)).toBe(true);

    expect(open.x).toBeCloseTo(1);
    expect(open.y).toBeCloseTo(0);
    // Head on at the block the field splits; the cell underfoot breaks the tie, off the line.
    expect(Math.abs(front.y)).toBeGreaterThan(0.5);
    expect(Math.hypot(front.x, front.y)).toBeCloseTo(1);
  });

  it('leads every cell of the block out to open ground the shortest way (MS-31)', () => {
    const field = fieldOf();
    const { cols } = field.grid;
    // The block is cells 10..13 by 2..5: a ring of 12 beside open ground around 4 inner cells.
    const stepsOut = (start: number): number => {
      let cell = start;
      let steps = 0;
      while (!field.isOpen(cell) && steps <= cols) {
        const step = field.direction[cell] ?? NO_DIRECTION;
        if (step === NO_DIRECTION) {
          return -1;
        }
        cell += (DIRECTION_ROWS[step] ?? 0) * cols + (DIRECTION_COLS[step] ?? 0);
        steps += 1;
      }
      return steps;
    };
    const steps: number[] = [];
    for (let row = 2; row <= 5; row += 1) {
      for (let col = 10; col <= 13; col += 1) {
        steps.push(stepsOut(row * cols + col));
      }
    }
    // Each inner cell takes the way out Light prefers among its nearer neighbours: straight
    // east or west, whatever order the fill reached them in.
    const [east, west] = [0, 1];
    const inner = [3, 4].flatMap((row) => [11, 12].map((col) => field.direction[row * cols + col]));
    const centre = { x: 0, y: 0 };

    expect(steps).toEqual([1, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 1]);
    expect(inner).toEqual([west, east, west, east]);
    expect(field.directionAt(60, 20, centre)).toBe(true);
    expect(Math.hypot(centre.x, centre.y)).toBeCloseTo(1);
  });

  it('has no direction off the grid, and leaves out untouched there', () => {
    const field = fieldOf();
    const out = { x: 7, y: 7 };

    expect(field.directionAt(-50, -50, out)).toBe(false);
    expect(out).toEqual({ x: 7, y: 7 });
  });

  it('sees a blocked line within the look-ahead only', () => {
    const field = fieldOf();

    expect(field.isLineClear(40, 20, 80, 20, 20)).toBe(false);
    expect(field.isLineClear(40, 20, 80, 20, 5)).toBe(true);
    expect(field.isLineClear(40, 5, 80, 5, 100)).toBe(true);
    expect(field.isLineClear(40, 20, 40, 20, 10)).toBe(true);
    // Leaving the grid counts as blocked.
    expect(field.isLineClear(110, 20, 140, 20, 50)).toBe(false);
  });

  it('says whether the ground under a point is walkable, and not off the grid', () => {
    const field = fieldOf();

    expect(field.isWalkableAt(90, 20)).toBe(true);
    expect(field.isWalkableAt(60, 20)).toBe(false);
    expect(field.isWalkableAt(-1, 20)).toBe(false);
    expect(field.isWalkableAt(10_000, 20)).toBe(false);
  });
});
