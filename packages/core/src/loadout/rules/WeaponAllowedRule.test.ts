import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../../content/legends/legendCatalogue';
import type { WeaponDefinition } from '../../content/weapons/weapons.types';
import type { LoadoutContent } from '../LoadoutValidator.types';
import { WeaponAllowedRule } from './WeaponAllowedRule';

type Rules = Pick<WeaponDefinition, 'allowedClasses' | 'uniqueTo'>;

/** The shipped classes and one weapon, `blade`, with the given restrictions. */
const contentWith = (blade: Rules): LoadoutContent => ({
  legends: LEGEND_CLASSES,
  weapons: { has: (id) => id === 'blade', get: () => blade },
});

const problemsOf = (classId: string, blade: Rules) =>
  new WeaponAllowedRule().check({ classId, primaryWeaponId: 'blade' }, contentWith(blade));

describe('WeaponAllowedRule', () => {
  it('lets every class carry a non-unique weapon', () => {
    for (const classId of ['warrior', 'sentinel', 'magus']) {
      expect(problemsOf(classId, { allowedClasses: 'any', uniqueTo: null })).toEqual([]);
    }
  });

  it('keeps a class-locked weapon to the classes it allows', () => {
    const staff: Rules = { allowedClasses: ['magus'], uniqueTo: 'magus' };

    expect(problemsOf('magus', staff)).toEqual([]);
    expect(problemsOf('warrior', staff)).toEqual([
      {
        field: 'primary-weapon',
        ruleId: 'weapon-allowed',
        message: 'class "warrior" may not carry weapon "blade"',
      },
    ]);
  });

  it('keeps a unique weapon to its class even when allowedClasses is "any"', () => {
    const unique: Rules = { allowedClasses: 'any', uniqueTo: 'magus' };

    expect(problemsOf('magus', unique)).toEqual([]);
    expect(problemsOf('sentinel', unique)).toHaveLength(1);
  });

  it('leaves an unknown class or weapon to ContentExistsRule', () => {
    const rule = new WeaponAllowedRule();
    const content = contentWith({ allowedClasses: ['magus'], uniqueTo: 'magus' });

    expect(rule.check({ classId: 'harbinger', primaryWeaponId: 'blade' }, content)).toEqual([]);
    expect(rule.check({ classId: 'warrior', primaryWeaponId: 'nope' }, content)).toEqual([]);
  });
});
