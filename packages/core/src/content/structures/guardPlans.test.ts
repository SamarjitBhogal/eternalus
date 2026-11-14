import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { AI_CADENCE } from '../ai/cadence';
import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { GUARD_PLANS } from './guardPlans';
import { STRUCTURE_DEFINITIONS } from './structureCatalogue';

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

  it('covers a guard whose decision waits its turn at the unit cap, 16 ticks apart not 10 (DEC-181)', () => {
    const { tickRate, limits } = createDefaultGameConfig();
    // The cap's units on both teams plus up to 48 camp mobs (18 §7.1); each brain waits at most
    // floor((brains - 1) / budget) ticks in the AI queue (AI56-F2).
    const brains = 2 * limits.maxUnitsPerTeam + 48;
    const wait = Math.floor((brains - 1) / AI_CADENCE.maxDecisionsPerTick);
    const largestTarget = Math.max(
      ...[...LEGEND_CLASSES.all(), ...MOB_DEFINITIONS.all()].map((unit) => unit.footprintRadius),
    );
    for (const plan of Object.values(GUARD_PLANS)) {
      for (const { mobId } of plan.table) {
        const guard = MOB_DEFINITIONS.get(mobId);
        const ticks = AI_CADENCE.everyTicks.guard + wait;
        const walk = (guard.movementProfile.maxSpeed * ticks) / tickRate;
        const stance = guard.footprintRadius + largestTarget + (guard.attack?.reach ?? 0);

        expect({ mobId, tolerance: plan.leashTolerance >= walk + stance }).toEqual({
          mobId,
          tolerance: true,
        });
      }
    }
  });

  it('keys every plan by a structure definition id, so no plan is silently left unused', () => {
    const unknown = Object.keys(GUARD_PLANS).filter((id) => !STRUCTURE_DEFINITIONS.has(id));

    expect(unknown).toEqual([]);
  });
});
