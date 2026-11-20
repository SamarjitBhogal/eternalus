import { describe, expect, it } from 'vitest';

import type { CollisionQuery } from '../state/CollisionQuery.types';
import type { Vec2 } from '../utils/geometry.types';
import { dashReach } from './dashReach';

/**
 * A collision rule whose only wall is the vertical line x = `wallX`: a circle moving east stops
 * `radius` short of it. It records each question it is asked. The rule itself (walls and the map's
 * edge) is `CollisionResolver.reach`'s, tested in `physics/CollisionResolver.test.ts`.
 */
const wallAt = (wallX: number) => {
  const asked: [Vec2, Vec2, number, number][] = [];
  const collisions: CollisionQuery = {
    reach: (from, direction, distance, radius) => {
      asked.push([from, direction, distance, radius]);
      return Math.max(0, Math.min(distance, (wallX - radius - from.x) / direction.x));
    },
  };
  return { collisions, asked };
};

const EAST = { x: 1, y: 0 };

describe('dashReach', () => {
  it('is the whole distance when the line is clear', () => {
    expect(dashReach(wallAt(100).collisions, { x: 10, y: 30 }, EAST, 8, 0.5)).toBe(8);
  });

  it('is the whole distance with no collision rule (no map objects)', () => {
    expect(dashReach(null, { x: 199, y: 30 }, EAST, 8, 0.5)).toBe(8);
  });

  it("stops where the caster's circle touches the wall, asking the rule with its radius", () => {
    const { collisions, asked } = wallAt(15);

    expect(dashReach(collisions, { x: 10, y: 30 }, EAST, 8, 0.5)).toBeCloseTo(4.5, 9);
    expect(asked).toEqual([[{ x: 10, y: 30 }, EAST, 8, 0.5]]);
  });

  it('is 0 for a dash that starts against the wall', () => {
    expect(dashReach(wallAt(10.5).collisions, { x: 10, y: 30 }, EAST, 8, 0.5)).toBe(0);
  });
});
