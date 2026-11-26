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
