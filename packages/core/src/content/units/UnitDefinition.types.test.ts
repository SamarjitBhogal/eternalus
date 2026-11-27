import { describe, expect, it } from 'vitest';

import type { UnitDefinition } from './units.types';

const BASE = {
  id: 'test-mob',
  kind: 'test-mob',
  displayName: 'Test mob',
  baseHealth: 10,
  footprintRadius: 0.5,
  visionRadius: 5,
  movementProfile: { maxSpeed: 1, acceleration: 1, mass: 1 },
} as const;

describe('UnitDefinition', () => {
  it('takes a mob attack with no onHit, and rejects one with onHit until the loader converts it (DEC-335)', () => {
    const plain: UnitDefinition = {
      ...BASE,
      attack: { strategy: 'melee', damage: 1, reach: 1, interval: 30 },
    };
    const authored: UnitDefinition = {
      ...BASE,
      attack: {
        strategy: 'melee',
        damage: 1,
        reach: 1,
        interval: 30,
        onHit: [
          // @ts-expect-error a mob attack has no onHit steps: no loader converts their seconds yet
          { kind: 'debuff', statusId: 'concussion', durationTicks: 45, shape: { kind: 'hit' } },
        ],
      },
    };

    expect(plain.attack?.damage).toBe(1);
    expect(authored.attack?.damage).toBe(1);
  });
});
