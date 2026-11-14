import { describe, expect, it } from 'vitest';

import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { CollisionQuery } from '../state/CollisionQuery.types';
import type { Vec2 } from '../utils/geometry.types';
import { dashReach } from './dashReach';

/**
 * A world on the two-lane map (200 x 60) whose only wall is the vertical line x = `wallX`: a circle
 * moving east stops `radius` short of it. It records each sweep it is asked for.
 */
const wallAt = (wallX: number) => {
  const asked: [Vec2, Vec2, number][] = [];
  const collisions: CollisionQuery = {
    travel: (start, displacement, radius) => {
      asked.push([start, displacement, radius]);
      const room = wallX - radius - start.x;
      return displacement.x <= room ? 1 : Math.max(0, room / displacement.x);
    },
  };
  return { world: { definition: TWO_LANE_MAP, collisions }, asked };
};

const EAST = { x: 1, y: 0 };

describe('dashReach', () => {
  it('is the whole distance when the line is clear', () => {
    expect(dashReach(wallAt(100).world, { x: 10, y: 30 }, EAST, 8, 0.5)).toBe(8);
  });

  it('is the whole distance with no map, or a map with no collision sweep', () => {
    expect(dashReach(null, { x: 0, y: 0 }, EAST, 8, 0.5)).toBe(8);
    const noSweep = { definition: TWO_LANE_MAP, collisions: null };
    expect(dashReach(noSweep, { x: 199, y: 30 }, EAST, 8, 0.5)).toBe(8);
  });

  it("stops where the caster's circle touches the wall, asking the sweep with its radius", () => {
    const { world, asked } = wallAt(15);

    expect(dashReach(world, { x: 10, y: 30 }, EAST, 8, 0.5)).toBeCloseTo(4.5, 9);
    expect(asked).toEqual([[{ x: 10, y: 30 }, { x: 8, y: 0 }, 0.5]]);
  });

  it('is 0 for a dash that starts against the wall', () => {
    expect(dashReach(wallAt(10.5).world, { x: 10, y: 30 }, EAST, 8, 0.5)).toBe(0);
  });

  it("stops at the map's edge as CollisionSystem clamps a unit, and sweeps only that far", () => {
    const { world, asked } = wallAt(1000);

    expect(dashReach(world, { x: 195, y: 30 }, EAST, 8, 0.5)).toBeCloseTo(4.5, 9);
    expect(dashReach(world, { x: 10, y: 3 }, { x: 0, y: -1 }, 8, 0.5)).toBeCloseTo(2.5, 9);
    expect(dashReach(world, { x: 10, y: 3 }, { x: -0.6, y: -0.8 }, 8, 0.5)).toBeCloseTo(3.125, 9);
    expect(asked[0]?.[1].x).toBeCloseTo(4.5, 9);
  });
});
