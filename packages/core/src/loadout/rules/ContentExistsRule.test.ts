import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../../content/legends/legendCatalogue';
import { LEGEND_SPECS } from '../../content/legends/specs/legendSpecCatalogue';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import type { LoadoutContent } from '../LoadoutValidator.types';
import { ContentExistsRule } from './ContentExistsRule';

const CONTENT: LoadoutContent = {
  legends: LEGEND_CLASSES,
  specs: LEGEND_SPECS,
  weapons: loadWeapons(30),
};

const rule = new ContentExistsRule();

describe('ContentExistsRule', () => {
  it('passes a loadout whose class, Legend and weapon all exist', () => {
    expect(
      rule.check({ classId: 'warrior', specId: 'knight', primaryWeaponId: 'wuuthrad' }, CONTENT),
    ).toEqual([]);
  });

  it('passes a loadout of no Legend', () => {
    expect(
      rule.check({ classId: 'warrior', specId: null, primaryWeaponId: 'wuuthrad' }, CONTENT),
    ).toEqual([]);
  });

  it('flags an unknown Legend as a problem of the class field (DEC-418 (2))', () => {
    expect(
      rule.check({ classId: 'warrior', specId: 'nobody', primaryWeaponId: 'wuuthrad' }, CONTENT),
    ).toEqual([
      { field: 'class', ruleId: 'content-exists', message: 'Legend "nobody" does not exist' },
    ]);
  });

  it('does not take a class id for a Legend id', () => {
    expect(
      rule
        .check({ classId: 'warrior', specId: 'warrior', primaryWeaponId: 'wuuthrad' }, CONTENT)
        .map(({ message }) => message),
    ).toEqual(['Legend "warrior" does not exist']);
  });

  it('flags an unknown class and an unknown weapon, each on its field', () => {
    expect(
      rule.check({ classId: 'harbinger', specId: null, primaryWeaponId: 'nope' }, CONTENT),
    ).toEqual([
      { field: 'class', ruleId: 'content-exists', message: 'class "harbinger" does not exist' },
      {
        field: 'primary-weapon',
        ruleId: 'content-exists',
        message: 'weapon "nope" does not exist',
      },
    ]);
  });
});
