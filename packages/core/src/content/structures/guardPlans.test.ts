import { describe, expect, it } from 'vitest';

import { countdownTicks } from '../../config/countdownTicks';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineMarkTick } from '../../config/timelineMarkTick';
import { AGGRO_RULES } from '../ai/aggro/aggroRules';
import { AI_CADENCE } from '../ai/cadence';
import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { GUARD_PLANS } from './guardPlans';

describe('GUARD_PLANS', () => {
  it('gives every guard a leash tolerance of one decision walk plus its farthest stance (DEC-144)', () => {
    const { tickRate } = createDefaultGameConfig();
    const largestTarget = Math.max(
      ...[...LEGEND_CLASSES.all(), ...MOB_DEFINITIONS.all()].map((unit) => unit.footprintRadius),
    );
    for (const plan of Object.values(GUARD_PLANS)) {
      for (const { mobId } of plan.table) {
        const guard = MOB_DEFINITIONS.get(mobId);
        const walk = (guard.movementProfile.maxSpeed * AI_CADENCE.everyTicks.guard) / tickRate;
        const stance = guard.footprintRadius + largestTarget + (guard.attack?.reach ?? 0);

        expect({ mobId, tolerance: plan.leashTolerance >= walk + stance }).toEqual({
          mobId,
          tolerance: true,
        });
      }
    }
  });

  it('gives the capture point boss an aggro range that reaches across its court from its post', () => {
    const plan = GUARD_PLANS['capture-point'];
    const aggro = AGGRO_RULES[MOB_DEFINITIONS.get('capture-point-boss').aiProfile ?? ''];

    expect(plan?.table.some(({ mobId }) => mobId === 'capture-point-boss')).toBe(true);
    expect(aggro?.acquisitionRadius ?? 0).toBeGreaterThanOrEqual(
      (plan?.leashRadius ?? Number.POSITIVE_INFINITY) + (plan?.postGap ?? 0),
    );
  });

  it('activates the capture point boss on the default timeline quarter mark (reference 04)', () => {
    const { tickRate, match } = createDefaultGameConfig();
    const quarter = match.timeline.find(({ id }) => id === 'quarter-mark');
    const activation = GUARD_PLANS['capture-point']?.activation;
    // The timeline counts from match start (tick 0); the guard plan from the countdown's end.
    const quarterTick =
      quarter === undefined
        ? -1
        : timelineMarkTick(quarter.at, tickRate, match.plannedMatchSeconds);
    const delayTicks =
      activation?.at === 'countdown-end' ? Math.round(activation.delaySeconds * tickRate) : 0;

    expect(activation?.at).toBe('countdown-end');
    expect(countdownTicks(match.countdownSeconds, tickRate) + delayTicks).toBe(quarterTick);
  });
});
