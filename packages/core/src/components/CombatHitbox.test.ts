import { expect, it } from 'vitest';

import { CombatHitbox } from './CombatHitbox';

it('projects the same local combat outline on each side of the unit as it turns', () => {
  const hitbox = new CombatHitbox([
    { x: -2, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: -1 },
  ]);
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

it('finds a point on the head on the side the unit faces, and never without a head outline', () => {
  const body = [
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
  const hitbox = new CombatHitbox(body, head);
  const position = { x: 10, y: 20 };
  const left = { x: -1, y: 0 };
  const right = { x: 1, y: 0 };

  expect(hitbox.isOnHead({ x: 6, y: 19 }, position, left)).toBe(true);
  expect(hitbox.isOnHead({ x: 14, y: 19 }, position, left)).toBe(false);
  expect(hitbox.isOnHead({ x: 14, y: 19 }, position, right)).toBe(true);
  expect(hitbox.isOnHead({ x: 6, y: 19 }, position, right)).toBe(false);
  expect(new CombatHitbox(body).isOnHead({ x: 6, y: 19 }, position, left)).toBe(false);
});

it('finds behind on the side the art shows its back, also when the unit faces up or down', () => {
  const hitbox = new CombatHitbox([
    { x: -2, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: -1 },
  ]);
  const position = { x: 10, y: 20 };
  const down = { x: 0, y: 1 };
  const upRight = { x: 0.3, y: -0.95 };

  expect(hitbox.isBehind({ x: 15, y: 20 }, position, down)).toBe(true);
  expect(hitbox.isBehind({ x: 10, y: 15 }, position, down)).toBe(false);
  expect(hitbox.isBehind({ x: 5, y: 20 }, position, down)).toBe(false);
  expect(hitbox.isBehind({ x: 5, y: 25 }, position, upRight)).toBe(true);
  expect(hitbox.isBehind({ x: 15, y: 15 }, position, upRight)).toBe(false);
  expect(hitbox.isBehind({ x: 10, y: 25 }, position, upRight)).toBe(false);
});
