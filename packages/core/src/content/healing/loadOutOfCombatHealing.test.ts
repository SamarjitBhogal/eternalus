import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadOutOfCombatHealing } from './loadOutOfCombatHealing';
import { OUT_OF_COMBAT_HEALING } from './outOfCombatHealing';

describe('loadOutOfCombatHealing', () => {
  it('converts the delay and the structure quiet time to ticks at load and keeps the rates', () => {
    expect(loadOutOfCombatHealing(30)).toEqual({
      delayTicks: 300,
      structureQuietTicks: 300,
      healthFractionPerSecond: OUT_OF_COMBAT_HEALING.healthFractionPerSecond,
      structureBonuses: OUT_OF_COMBAT_HEALING.structureBonuses,
    });
    expect(loadOutOfCombatHealing(10)).toMatchObject({ delayTicks: 100, structureQuietTicks: 100 });
  });

  it('rounds each time to the nearest tick with no one-tick floor', () => {
    const loaded = loadOutOfCombatHealing(30, {
      ...OUT_OF_COMBAT_HEALING,
      delaySeconds: 0.51,
      structureQuietSeconds: 0,
    });
    expect(loaded.delayTicks).toBe(15);
    expect(loaded.structureQuietTicks).toBe(0);
  });

  it('rejects a time that is negative or not a number, naming each one', () => {
    expect(() =>
      loadOutOfCombatHealing(30, { ...OUT_OF_COMBAT_HEALING, delaySeconds: -1 }),
    ).toThrow(ContentValidationError);
    expect(() =>
      loadOutOfCombatHealing(30, {
        ...OUT_OF_COMBAT_HEALING,
        delaySeconds: Number.NaN,
        structureQuietSeconds: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(
      'Invalid out-of-combat healing: delaySeconds is NaN s; structureQuietSeconds is Infinity s',
    );
  });
});
