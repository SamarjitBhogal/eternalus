import { describe, expect, it } from 'vitest';

import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
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

  it('has no direction inside the block or off the grid, and leaves out untouched there', () => {
    const field = fieldOf();
    const out = { x: 7, y: 7 };

    expect(field.directionAt(60, 20, out)).toBe(false);
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
