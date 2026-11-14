import { describe, expect, it } from 'vitest';

import { ABILITIES } from '../abilities/abilityCatalogue';
import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { ORACLE } from '../legends/specs/oracle';
import { WARRIOR } from '../legends/warrior';
import { KnownAbilityRefsRule } from './KnownAbilityRefsRule';

const rule = new KnownAbilityRefsRule(ABILITIES, LEGEND_CLASSES);

describe('KnownAbilityRefsRule', () => {
  it('accepts every shipped class and spec', () => {
    for (const legend of LEGEND_CLASSES.all()) {
      expect(rule.check(legend)).toEqual([]);
    }
    expect(rule.check(ORACLE)).toEqual([]);
  });

  it('flags a pool entry and a kit entry that name no ability', () => {
    const warrior = {
      ...WARRIOR,
      abilityPool: [...WARRIOR.abilityPool, 'blade-runnr'],
      defaultKit: { ...WARRIOR.defaultKit, abilities: ['blade-runnr', 'veil', 'hamstring'] },
    } as const;

    expect(rule.check(warrior)).toEqual([
      'abilityPool "blade-runnr" names no ability',
      'defaultKit "blade-runnr" names no ability',
    ]);
  });

  it("flags an ability of another class, in a pool and in a spec's kit", () => {
    const warrior = { ...WARRIOR, abilityPool: [...WARRIOR.abilityPool, 'slam'] };
    const spec = {
      ...ORACLE,
      kit: { abilities: ['shockwave', 'sanctuary', 'slam'], ultimate: 'death-ray' },
    } as const;

    expect(rule.check(warrior)).toEqual(['abilityPool "slam" belongs to class "sentinel"']);
    expect(rule.check(spec)).toEqual(['kit "slam" belongs to class "sentinel"']);
  });

  it('flags an ultimate in an ability slot and an ability in the ultimate slot', () => {
    const warrior = {
      ...WARRIOR,
      defaultKit: { abilities: ['blade-runner', 'fury', 'hamstring'], ultimate: 'veil' },
    } as const;

    expect(rule.check(warrior)).toEqual([
      'defaultKit "fury" is not an ability',
      'defaultKit "veil" is not an ultimate',
    ]);
  });

  it('has nothing to check on a spec with no kit', () => {
    expect(rule.check({ ...ORACLE, kit: null })).toEqual([]);
  });
});
