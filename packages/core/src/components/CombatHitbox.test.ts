import { expect, it } from 'vitest';

import { CombatHitbox } from './CombatHitbox';

const TRIANGLE = [
  { x: -2, y: 1 },
  { x: 1, y: 2 },
  { x: 0, y: -1 },
];

it('projects the same local combat outline on each side of the unit as it turns', () => {
  const hitbox = new CombatHitbox({ outline: TRIANGLE });
  const position = { x: 10, y: 20 };
  expect(hitbox.polygonAt(position, { x: -1, y: 0 })).toEqual([
    { x: 8, y: 21 },
    { x: 11, y: 22 },
    { x: 10, y: 19 },
  ]);
  expect(hitbox.polygonAt(position, { x: 1, y: 0 })).toEqual([
    { x: 12, y: 21 },
    { x: 9, y: 22 },
    { x: 10, y: 19 },
  ]);
});

it('finds a head shot on the side the unit faces: on the head, or a line of flight through it (HC-B60 A)', () => {
  const outline = [
    { x: -6, y: -3 },
    { x: 6, y: -3 },
    { x: 6, y: 3 },
    { x: -6, y: 3 },
  ];
  const head = [
    { x: -5, y: -2 },
    { x: -3, y: -2 },
    { x: -3, y: 0 },
    { x: -5, y: 0 },
  ];
  const hitbox = new CombatHitbox({ outline, head });
  const position = { x: 10, y: 20 };
  const left = { x: -1, y: 0 };
  const right = { x: 1, y: 0 };
  /** A shot from the left at height `y` that strikes the body's left edge (x 4). */
  const fromLeft = (y: number) =>
    [
      { x: 0, y },
      { x: 4, y },
    ] as const;

  // The impact point is on the head (world x 5 to 7 facing left, 13 to 15 facing right).
  expect(hitbox.isHeadShot({ x: 6, y: 19 }, { x: 6, y: 19 }, position, left)).toBe(true);
  expect(hitbox.isHeadShot({ x: 14, y: 19 }, { x: 14, y: 19 }, position, left)).toBe(false);
  expect(hitbox.isHeadShot({ x: 14, y: 19 }, { x: 14, y: 19 }, position, right)).toBe(true);
  // The line of flight, carried on from the body's edge, crosses the head on either side.
  expect(hitbox.isHeadShot(...fromLeft(19), position, left)).toBe(true);
  expect(hitbox.isHeadShot(...fromLeft(19), position, right)).toBe(true);
  expect(hitbox.isHeadShot(...fromLeft(22), position, left)).toBe(false);
  expect(hitbox.isHeadShot({ x: 20, y: 19 }, { x: 16, y: 19 }, position, left)).toBe(true);
  expect(new CombatHitbox({ outline }).isHeadShot(...fromLeft(19), position, left)).toBe(false);
});

it('rejects an outline or a head of fewer than 3 finite corners', () => {
  expect(() => new CombatHitbox({ outline: TRIANGLE.slice(0, 2) })).toThrow(/3 finite corners/);
  expect(
    () => new CombatHitbox({ outline: TRIANGLE, head: [...TRIANGLE, { x: Number.NaN, y: 0 }] }),
  ).toThrow(/3 finite corners/);
});

it('finds behind in the zone on the side the art shows its back, also when the unit faces up or down', () => {
  const hitbox = new CombatHitbox({ outline: TRIANGLE });
  const position = { x: 10, y: 20 };
  const down = { x: 0, y: 1 };
  const upRight = { x: 0.3, y: -0.95 };

  const rearHalf = 0;
  const cone120 = 0.5;

  expect(hitbox.isBehind({ x: 15, y: 20 }, position, down, rearHalf)).toBe(true);
  expect(hitbox.isBehind({ x: 10, y: 15 }, position, down, rearHalf)).toBe(false);
  expect(hitbox.isBehind({ x: 5, y: 20 }, position, down, rearHalf)).toBe(false);
  expect(hitbox.isBehind({ x: 5, y: 25 }, position, upRight, rearHalf)).toBe(true);
  expect(hitbox.isBehind({ x: 15, y: 15 }, position, upRight, rearHalf)).toBe(false);
  expect(hitbox.isBehind({ x: 10, y: 25 }, position, upRight, rearHalf)).toBe(false);
  // 60 degrees each side of the back: (3, 5) is 59 degrees off it, (3, 5.3) 60.5 degrees.
  expect(hitbox.isBehind({ x: 13, y: 25 }, position, down, cone120)).toBe(true);
  expect(hitbox.isBehind({ x: 13, y: 25.3 }, position, down, cone120)).toBe(false);
  expect(hitbox.isBehind({ x: 11, y: 30 }, position, down, rearHalf)).toBe(true);
  expect(hitbox.isBehind({ x: 11, y: 30 }, position, down, cone120)).toBe(false);
});
