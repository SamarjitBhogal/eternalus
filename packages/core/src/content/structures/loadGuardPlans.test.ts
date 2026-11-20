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

    expect(authored.respawn).toEqual({ kind: 'each', seconds: 120 });
    expect(loaded['spawner-tower']).toEqual({
      ...authored,
      respawn: { kind: 'each', ticks: 3600 },
    });
    expect(loaded['forest-camp-light']?.respawn).toEqual({ kind: 'group', ticks: 3600 });
    expect(loadGuardPlans(10).stronghold?.respawn).toEqual({ kind: 'each', ticks: 1200 });
    expect(Object.keys(loaded)).toEqual(Object.keys(GUARD_PLANS));
  });

  it('converts the delay after the countdown from seconds to ticks and keeps `never`', () => {
    const plan = GUARD_PLANS['spawner-tower'];
    if (plan === undefined) {
      throw new Error('no spawner-tower guard plan');
    }

    const loaded = loadGuardPlans(30, {
      late: { ...plan, activation: { at: 'countdown-end', delaySeconds: 440 } },
      once: { ...plan, respawn: { kind: 'never' } },
    });

    expect(loaded.late?.activation).toEqual({ at: 'countdown-end', delayTicks: 13200 });
    expect(loaded.once?.activation).toEqual({ at: 'match-start' });
    expect(loaded.once?.respawn).toEqual({ kind: 'never' });
  });

  it('rejects a respawn time that is negative or not a number, naming each plan', () => {
    const plan = GUARD_PLANS['spawner-tower'];
    if (plan === undefined) {
      throw new Error('no spawner-tower guard plan');
    }

    expect(() =>
      loadGuardPlans(30, {
        a: { ...plan, respawn: { kind: 'each', seconds: -5 } },
        b: plan,
        c: { ...plan, respawn: { kind: 'group', seconds: Number.POSITIVE_INFINITY } },
      }),
    ).toThrow(
      new ContentValidationError(
        'Invalid guard plans: a respawn.seconds is -5 s; c respawn.seconds is Infinity s',
      ),
    );
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects a guard plan that activates %s s after the countdown',
    (delaySeconds) => {
      const plan = GUARD_PLANS.stronghold;
      if (plan === undefined) {
        throw new Error('no stronghold guard plan');
      }

      expect(() =>
        loadGuardPlans(30, {
          stronghold: { ...plan, activation: { at: 'countdown-end', delaySeconds } },
        }),
      ).toThrow(
        new ContentValidationError(
          `Invalid guard plans: stronghold activation.delaySeconds is ${String(delaySeconds)} s`,
        ),
      );
    },
  );
});
