import { describe, expect, it } from 'vitest';

import { ABILITIES } from '../abilities/abilityCatalogue';
import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MAGUS } from '../legends/magus';
import { ASSASSIN } from '../legends/specs/assassin';
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
    expect(rule.check(ASSASSIN)).toEqual([]);
  });

  it("flags a spec's artifact that names no ability, is another class's or is not a gadget", () => {
    const spec = { ...ASSASSIN, artifacts: ['weapon-swp', 'veil'] } as const;
    const magus = { ...ORACLE, artifacts: [null, 'weapon-swap'] } as const;

    expect(rule.check(spec)).toEqual([
      'artifacts "weapon-swp" names no ability',
      'artifacts "veil" has slot kind "ability", not "gadget"',
    ]);
    expect(rule.check(magus)).toEqual(['artifacts "weapon-swap" belongs to class "warrior"']);
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
      'defaultKit "fury" has slot kind "ultimate", not "ability"',
      'defaultKit "veil" has slot kind "ability", not "ultimate"',
    ]);
  });

  it('has nothing to check on a spec with no kit', () => {
    expect(rule.check({ ...ORACLE, kit: null })).toEqual([]);
  });

  describe('passives', () => {
    const lastOf = (messages: readonly string[]) => messages.at(-1) ?? '';

    it('flags a spec passiveId that names no ability', () => {
      expect(rule.check({ ...ORACLE, passiveId: 'erudtion' })).toEqual([
        'passiveId "erudtion" names no ability',
      ]);
    });

    it("flags a spec passiveId that is another class's passive", () => {
      expect(rule.check({ ...ORACLE, passiveId: 'wrecking-run' })).toEqual([
        'passiveId "wrecking-run" belongs to class "sentinel"',
      ]);
    });

    it('flags a spec passiveId that is not a passive', () => {
      const messages = rule.check({ ...ORACLE, passiveId: 'shockwave' });

      expect(messages).toHaveLength(1);
      expect(lastOf(messages)).toMatch(
        /^passiveId "shockwave" has slot kind "ability", not "passive"$/,
      );
    });

    it('flags a class passiveOptions entry that is not a passive', () => {
      const magus = { ...MAGUS, passiveOptions: [...MAGUS.passiveOptions, 'shockwave'] };
      const messages = rule.check(magus);

      expect(messages).toHaveLength(1);
      expect(lastOf(messages)).toMatch(
        /^passiveOptions "shockwave" has slot kind "ability", not "passive"$/,
      );
    });

    it('flags a class defaultPassiveId that is not a passive (DEC-361)', () => {
      const magus = { ...MAGUS, defaultPassiveId: 'shockwave' };
      const messages = rule.check(magus);

      expect(messages).toHaveLength(1);
      expect(lastOf(messages)).toMatch(
        /^defaultPassiveId "shockwave" has slot kind "ability", not "passive"$/,
      );
    });

    it('accepts a spec with no passive', () => {
      expect(rule.check({ ...ORACLE, passiveId: null })).toEqual([]);
    });
  });
});
