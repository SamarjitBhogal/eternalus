import { describe, expect, it } from 'vitest';

import { StatusEffects } from '../components/StatusEffects';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { castStatsOf } from './castStatsOf';

describe('castStatsOf', () => {
  it('is 1 for both stats with no statuses, or none that touch them', () => {
    expect(castStatsOf(undefined)).toEqual({ potency: 1, stretch: 1 });
    expect(castStatsOf(new StatusEffects())).toEqual({ potency: 1, stretch: 1 });
  });

  it('reads abilityPotency as the potency and abilityDuration as the stretch (Erudition)', () => {
    const statuses = new StatusEffects();
    statuses.apply(loadStatusEffects(30, 2).get('erudition'), null, 0);

    const stats = castStatsOf(statuses);

    expect(stats.potency).toBeCloseTo(1.1);
    expect(stats.stretch).toBeCloseTo(1.2);
  });
});
