import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadOutOfCombatHealing } from './loadOutOfCombatHealing';
import { OUT_OF_COMBAT_HEALING } from './outOfCombatHealing';
import type { AuthoredOutOfCombatHealing } from './outOfCombatHealing.types';

describe('loadOutOfCombatHealing', () => {
  it('converts the times to ticks and the rates to per tick at load', () => {
    const authored: AuthoredOutOfCombatHealing = {
      delaySeconds: 4,
      healthFractionPerSecond: 0.06,
      structureQuietSeconds: 2,
      structureBonuses: {
        'spawner-tower': { fractionPerSecond: 0.3, zone: 'fort-box' },
        stronghold: { fractionPerSecond: 0.9, zone: 'stronghold-interior' },
      },
    };
    expect(loadOutOfCombatHealing(30, authored)).toEqual({
      delayTicks: 120,
      healthFractionPerTick: 0.06 / 30,
      structureQuietTicks: 60,
      structureBonuses: {
        'spawner-tower': { fractionPerTick: 0.3 / 30, zone: 'fort-box' },
        stronghold: { fractionPerTick: 0.9 / 30, zone: 'stronghold-interior' },
      },
    });
    expect(loadOutOfCombatHealing(10, authored)).toMatchObject({
      delayTicks: 40,
      healthFractionPerTick: 0.06 / 10,
      structureQuietTicks: 20,
    });
  });

  it('loads the shipped record by default', () => {
    expect(loadOutOfCombatHealing(30)).toEqual(loadOutOfCombatHealing(30, OUT_OF_COMBAT_HEALING));
  });

  it('rounds each time to the nearest tick with no one-tick floor', () => {
    const rounded = loadOutOfCombatHealing(30, {
      ...OUT_OF_COMBAT_HEALING,
      delaySeconds: 0.51,
      structureQuietSeconds: 0,
    });
    expect(rounded.delayTicks).toBe(15);
    expect(rounded.structureQuietTicks).toBe(0);
    const zero = loadOutOfCombatHealing(30, { ...OUT_OF_COMBAT_HEALING, delaySeconds: 0 });
    expect(zero.delayTicks).toBe(0);
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

  it('rejects a rate that is negative or not a number, naming each one', () => {
    expect(() =>
      loadOutOfCombatHealing(30, {
        ...OUT_OF_COMBAT_HEALING,
        healthFractionPerSecond: -0.02,
        structureBonuses: {
          stronghold: { fractionPerSecond: Number.NaN, zone: 'stronghold-interior' },
        },
      }),
    ).toThrow(
      new ContentValidationError(
        'Invalid out-of-combat healing: healthFractionPerSecond is -0.02 per s; stronghold fractionPerSecond is NaN per s',
      ),
    );
  });
});
