import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { GUARD_PLANS } from './guardPlans';
import { loadGuardPlans } from './loadGuardPlans';

describe('loadGuardPlans', () => {
  it('converts the respawn time from seconds to ticks at load and keeps the other fields', () => {
    const loaded = loadGuardPlans(30);
    const authored = GUARD_PLANS['spawner-tower'];
    if (authored === undefined) {
      throw new Error('no spawner-tower guard plan');
    }
    const { respawnSeconds, ...rest } = authored;

    expect(respawnSeconds).toBe(120);
    expect(loaded['spawner-tower']).toEqual({ ...rest, respawnTicks: 3600 });
    expect(loaded['forest-camp-light']?.respawnTicks).toBe(3600);
    expect(loadGuardPlans(10).stronghold?.respawnTicks).toBe(1200);
    expect(Object.keys(loaded)).toEqual(Object.keys(GUARD_PLANS));
  });

  it('rejects a respawn time that is negative or not a number, naming each plan', () => {
    const plan = GUARD_PLANS['spawner-tower'];
    if (plan === undefined) {
      throw new Error('no spawner-tower guard plan');
    }

    expect(() =>
      loadGuardPlans(30, {
        a: { ...plan, respawnSeconds: -5 },
        b: plan,
        c: { ...plan, respawnSeconds: Number.POSITIVE_INFINITY },
      }),
    ).toThrow(
      new ContentValidationError(
        'Invalid guard plans: a respawnSeconds is -5 s; c respawnSeconds is Infinity s',
      ),
    );
  });
});
