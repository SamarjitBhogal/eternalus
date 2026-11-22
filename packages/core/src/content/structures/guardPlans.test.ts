import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { timelineFrameOf } from '../../config/timelineFrameOf';
import { timelineMarkTick } from '../../config/timelineMarkTick';
import { AGGRO_RULES } from '../ai/aggro/aggroRules';
import { AI_CADENCE } from '../ai/cadence';
import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { GUARD_PLANS } from './guardPlans';
import { ZONE_DEFINITIONS } from '../zones/zoneCatalogue';
import { STRUCTURE_DEFINITIONS } from './structureCatalogue';

/**
 * Mobs that only ever stand in the centre zone: the guards of a `gem-eruption` plan (the Greater
 * Boss). They are no other plan's target, since no other guard post reaches the centre zone
 * (`greaterBossSpawn.scenario.test.ts` checks it on the map).
 */
const CENTRE_ONLY = new Set(
  Object.values(GUARD_PLANS)
    .filter(({ activation }) => activation.at === 'gem-eruption')
    .flatMap(({ table }) => table.map(({ mobId }) => mobId)),
);

describe('GUARD_PLANS', () => {
  it('gives every guard a leash tolerance of one decision walk plus its farthest stance (DEC-144)', () => {
    const { tickRate } = createDefaultGameConfig();
    const largestTarget = Math.max(
      ...[...LEGEND_CLASSES.all(), ...MOB_DEFINITIONS.all()]
        .filter(({ id }) => !CENTRE_ONLY.has(id))
        .map((unit) => unit.footprintRadius),
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
    const config = createDefaultGameConfig();
    const frame = timelineFrameOf(config);
    const quarter = config.match.timeline.find(({ id }) => id === 'quarter-mark');
    const activation = GUARD_PLANS['capture-point']?.activation;
    // Timeline fractions and the guard plan both count from the countdown's end (DEC-282).
    const quarterTick = quarter === undefined ? -1 : timelineMarkTick(quarter.at, frame);
    const delayTicks =
      activation?.at === 'countdown-end'
        ? Math.round(activation.delaySeconds * config.tickRate)
        : 0;

    expect(activation?.at).toBe('countdown-end');
    expect(frame.countdownEndTick + delayTicks).toBe(quarterTick);
  });

  it('covers a guard whose decision waits its turn at the unit cap, 16 ticks apart not 10 (DEC-181)', () => {
    const { tickRate, limits } = createDefaultGameConfig();
    // The cap's units on both teams plus up to 48 camp mobs (18 §7.1); each brain waits at most
    // floor((brains - 1) / budget) ticks in the AI queue (AI56-F2).
    const brains = 2 * limits.maxUnitsPerTeam + 48;
    const wait = Math.floor((brains - 1) / AI_CADENCE.maxDecisionsPerTick);
    // A camp's or zone's guards are neutral, and neutral units are allies, so such a guard never
    // targets another neutral home's mob (the corner boss, the largest unit, is one).
    const isNeutralHome = (homeId: string): boolean =>
      ZONE_DEFINITIONS.has(homeId) || STRUCTURE_DEFINITIONS.get(homeId).kind === 'camp';
    const neutralMobs = new Set(
      Object.entries(GUARD_PLANS)
        .filter(([homeId]) => isNeutralHome(homeId))
        .flatMap(([, plan]) => plan.table.map(({ mobId }) => mobId)),
    );
    const largestTarget = (isNeutral: boolean): number =>
      Math.max(
        ...[...LEGEND_CLASSES.all(), ...MOB_DEFINITIONS.all()]
          .filter(({ id }) => (!isNeutral || !neutralMobs.has(id)) && !CENTRE_ONLY.has(id))
          .map((unit) => unit.footprintRadius),
      );
    for (const [homeId, plan] of Object.entries(GUARD_PLANS)) {
      for (const { mobId } of plan.table) {
        const guard = MOB_DEFINITIONS.get(mobId);
        const ticks = AI_CADENCE.everyTicks.guard + wait;
        const walk = (guard.movementProfile.maxSpeed * ticks) / tickRate;
        const target = largestTarget(isNeutralHome(homeId));
        const stance = guard.footprintRadius + target + (guard.attack?.reach ?? 0);

        expect({ mobId, tolerance: plan.leashTolerance >= walk + stance }).toEqual({
          mobId,
          tolerance: true,
        });
      }
    }
  });

  it('keys every plan by a structure or zone definition id, so no plan is silently left unused', () => {
    const unknown = Object.keys(GUARD_PLANS).filter(
      (id) => !STRUCTURE_DEFINITIONS.has(id) && !ZONE_DEFINITIONS.has(id),
    );

    expect(unknown).toEqual([]);
  });
});
