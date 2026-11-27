import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MAGUS } from '../legends/magus';
import { SENTINEL } from '../legends/sentinel';
import { LEGEND_SPECS } from '../legends/specs/legendSpecCatalogue';
import { ORACLE } from '../legends/specs/oracle';
import { PassiveInOptionsRule } from './PassiveInOptionsRule';

const rule = new PassiveInOptionsRule(LEGEND_CLASSES);

describe('PassiveInOptionsRule', () => {
  it('accepts every shipped class and every shipped spec', () => {
    for (const definition of [...LEGEND_CLASSES.all(), ...LEGEND_SPECS.all()]) {
      expect(rule.check(definition)).toEqual([]);
    }
  });

  it("flags a spec's passiveId outside its class's passiveOptions, and passes null", () => {
    expect(rule.check({ ...ORACLE, passiveId: 'wrecking-run' })).toEqual([
      'passiveId "wrecking-run" is not in the passiveOptions of class "magus"',
    ]);
    expect(rule.check({ ...ORACLE, passiveId: 'necromancy' })).toEqual([]);
    expect(rule.check({ ...ORACLE, passiveId: null })).toEqual([]);
  });

  it("flags a class's defaultPassiveId outside its own passiveOptions, and passes null", () => {
    const sentinel = { ...SENTINEL, defaultPassiveId: 'erudition' };
    const magus = { ...MAGUS, defaultPassiveId: 'necromancy' };

    expect(rule.check(sentinel)).toEqual([
      'defaultPassiveId "erudition" is not in the passiveOptions of class "sentinel"',
    ]);
    expect(rule.check(magus)).toEqual([]);
    expect(rule.check(MAGUS)).toEqual([]);
  });

  it('has nothing to check on a spec whose class is not loaded', () => {
    expect(rule.check({ ...ORACLE, classId: 'harbinger', passiveId: 'erudition' })).toEqual([]);
  });
});
