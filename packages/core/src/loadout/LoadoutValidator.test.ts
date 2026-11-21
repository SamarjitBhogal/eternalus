import { describe, expect, it } from 'vitest';

import { LoadoutValidator } from './LoadoutValidator';
import type { LoadoutContent, LoadoutRule } from './LoadoutValidator.types';

const CONTENT: LoadoutContent = {
  legends: { has: () => true, get: () => ({ defaultLoadout: { primaryWeaponId: 'w' } }) },
  weapons: { has: () => true, get: () => ({ allowedClasses: 'any', uniqueTo: null }) },
};

const ruleFinding = (id: string, count: number): LoadoutRule => ({
  id,
  check: () =>
    Array.from({ length: count }, (_, index) => ({
      field: 'primary-weapon' as const,
      ruleId: id,
      message: `${id} ${String(index)}`,
    })),
});

describe('LoadoutValidator', () => {
  it('collects every problem of every injected rule, in rule order', () => {
    const validator = new LoadoutValidator([ruleFinding('a', 2), ruleFinding('b', 1)]);

    expect(
      validator.validate({ classId: 'c', primaryWeaponId: 'w' }, CONTENT).map((p) => p.message),
    ).toEqual(['a 0', 'a 1', 'b 0']);
  });

  it('finds nothing with no rules', () => {
    expect(
      new LoadoutValidator([]).validate({ classId: 'c', primaryWeaponId: 'w' }, CONTENT),
    ).toEqual([]);
  });
});
