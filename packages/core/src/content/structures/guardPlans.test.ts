import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
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

  it('activates the capture point boss a positive delay after the countdown (reference 04: the quarter mark)', () => {
    const activation = GUARD_PLANS['capture-point']?.activation;

    expect(activation?.at).toBe('countdown-end');
    expect(activation?.at === 'countdown-end' ? activation.delaySeconds : 0).toBeGreaterThan(0);
  });
});
