import { describe, expect, it } from 'vitest';

import { AGGRO_RULES } from './aggroRules';
import { LANE_MINION_AGGRO } from './laneMinion';
import { loadAggroRules } from './loadAggroRules';

describe('loadAggroRules', () => {
  it('converts the leash grace and the aggro cooldown from seconds to ticks at load', () => {
    const loaded = loadAggroRules(30);

    expect(loaded['lane-minion']).toMatchObject({ leashGraceTicks: 90, aggroCooldownTicks: 90 });
    expect(loadAggroRules(10)['lane-minion']).toMatchObject({
      leashGraceTicks: 30,
      aggroCooldownTicks: 30,
    });
    expect(loaded['lane-minion']).not.toHaveProperty('leashGraceSeconds');
    expect(loaded['lane-minion']).not.toHaveProperty('aggroCooldownSeconds');
  });

  it('keeps a 0 s grace and cooldown at 0 ticks, so a guard drops its target at once (DEC-144)', () => {
    const loaded = loadAggroRules(30);

    expect(loaded['tower-guard']).toMatchObject({ leashGraceTicks: 0, aggroCooldownTicks: 0 });
    expect(loaded['camp-mob']).toMatchObject({ leashGraceTicks: 0, aggroCooldownTicks: 0 });
  });

  it('rounds to the nearest tick and keeps every other field and every id', () => {
    const loaded = loadAggroRules(30, {
      odd: { ...LANE_MINION_AGGRO, id: 'odd', leashGraceSeconds: 0.51, aggroCooldownSeconds: 0.49 },
    });

    expect(loaded.odd).toMatchObject({
      id: 'odd',
      controller: 'minion',
      priority: LANE_MINION_AGGRO.priority,
      leashRadius: LANE_MINION_AGGRO.leashRadius,
      callForHelpRadius: LANE_MINION_AGGRO.callForHelpRadius,
      leashGraceTicks: 15,
      aggroCooldownTicks: 15,
    });
    expect(Object.keys(loadAggroRules(30))).toEqual(Object.keys(AGGRO_RULES));
  });
});
