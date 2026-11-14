import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { ORACLE } from '../legends/specs/oracle';
import { WARRIOR } from '../legends/warrior';
import { KitInPoolRule } from './KitInPoolRule';

const rule = new KitInPoolRule(LEGEND_CLASSES);

describe('KitInPoolRule', () => {
  it('accepts every shipped class default kit and every shipped spec', () => {
    for (const legend of LEGEND_CLASSES.all()) {
      expect(rule.check(legend)).toEqual([]);
    }
    expect(rule.check(ORACLE)).toEqual([]);
  });

  it('flags a class default kit that names an ability outside its pool', () => {
    const warrior = {
      ...WARRIOR,
      abilityPool: ['blade-runner', 'veil', 'fury'],
    };

    expect(rule.check(warrior)).toEqual([
      'defaultKit "hamstring" is not in the abilityPool of class "warrior"',
    ]);
  });

  it('flags the ultimate too', () => {
    const warrior = { ...WARRIOR, defaultKit: { ...WARRIOR.defaultKit, ultimate: 'death-ray' } };

    expect(rule.check(warrior)).toEqual([
      'defaultKit "death-ray" is not in the abilityPool of class "warrior"',
    ]);
  });

  it("flags a spec's own kit that leaves its class's pool", () => {
    const spec = {
      ...ORACLE,
      kit: { abilities: ['shockwave', 'sanctuary', 'blade-runner'], ultimate: 'death-ray' },
    } as const;

    expect(rule.check(spec)).toEqual([
      'kit "blade-runner" is not in the abilityPool of class "magus"',
    ]);
  });

  it('has nothing to check on a spec with no kit, or a spec whose class is not loaded', () => {
    expect(rule.check({ ...ORACLE, kit: null })).toEqual([]);
    expect(
      rule.check({
        ...ORACLE,
        classId: 'harbinger',
        kit: { abilities: ['a', 'b', 'c'], ultimate: 'd' },
      }),
    ).toEqual([]);
  });
});
