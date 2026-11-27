import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { KNOCKBACK } from './knockback';
import { loadKnockback } from './loadKnockback';

describe('loadKnockback', () => {
  it('converts the travel time from seconds to ticks at load and keeps the other fields', () => {
    expect(loadKnockback(30)).toEqual({
      baseMass: KNOCKBACK.baseMass,
      travelTicks: 8, // 0.25 s at 30 ticks per second is 7.5, rounded up
      staggerStatusId: KNOCKBACK.staggerStatusId,
      knockupStatusId: KNOCKBACK.knockupStatusId,
      impactDamage: 40, // DEC-382 (HC-B43 (6))
    });
    expect(loadKnockback(10).travelTicks).toBe(3);
  });

  it('never makes a push shorter than one tick', () => {
    expect(loadKnockback(30, { ...KNOCKBACK, travelSeconds: 0 }).travelTicks).toBe(1);
  });

  it('rejects a travel time that is negative or not a number', () => {
    expect(() => loadKnockback(30, { ...KNOCKBACK, travelSeconds: -0.25 })).toThrow(
      ContentValidationError,
    );
    expect(() => loadKnockback(30, { ...KNOCKBACK, travelSeconds: Number.NaN })).toThrow(
      'Invalid knock-back: travelSeconds is NaN s',
    );
  });

  it('rejects an impact damage that is negative or not a number', () => {
    expect(() => loadKnockback(30, { ...KNOCKBACK, impactDamage: -1 })).toThrow(
      'Invalid knock-back: impactDamage is -1 hp',
    );
    expect(() => loadKnockback(30, { ...KNOCKBACK, impactDamage: Number.NaN })).toThrow(
      ContentValidationError,
    );
  });
});
