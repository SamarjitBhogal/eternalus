import { describe, expect, it } from 'vitest';

import { eruptionPlanProblems } from './eruptionPlanProblems';

const BOSS = { homeId: 'cathedral', mobId: 'greater-boss' };
const CAMP = { homeId: 'camp', mobId: 'camp-mob' };
const isEruptionPost = ({ homeId }: { readonly homeId: string }): boolean => homeId === 'cathedral';

describe('eruptionPlanProblems (12 §3)', () => {
  it('passes a summoned boss that a gem-eruption post holds', () => {
    expect(eruptionPlanProblems([BOSS, CAMP], isEruptionPost, ['greater-boss'])).toEqual([]);
  });

  it('names a summoned boss that no gem-eruption post holds, once', () => {
    expect(eruptionPlanProblems([BOSS, CAMP], isEruptionPost, ['camp-mob', 'camp-mob'])).toEqual([
      'summon-greater-boss names "camp-mob", which no gem-eruption post holds',
    ]);
  });

  it('checks nothing on a map with no gem-eruption post (a test map or a Duel)', () => {
    expect(eruptionPlanProblems([CAMP], isEruptionPost, ['nobody'])).toEqual([]);
  });
});
