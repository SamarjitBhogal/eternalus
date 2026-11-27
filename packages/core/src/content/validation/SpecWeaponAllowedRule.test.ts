import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { KNIGHT } from '../legends/specs/knight';
import { ORACLE } from '../legends/specs/oracle';
import { WEAPONS } from '../weapons/weaponCatalogue';
import { SpecWeaponAllowedRule } from './SpecWeaponAllowedRule';

const RULE = new SpecWeaponAllowedRule(LEGEND_CLASSES, WEAPONS);

describe('SpecWeaponAllowedRule', () => {
  it('accepts a spec whose class may use its weapon, and a spec with no weapon of its own', () => {
    expect(RULE.check(KNIGHT)).toEqual([]);
    expect(RULE.check({ ...KNIGHT, primaryWeaponId: null })).toEqual([]);
  });

  it('rejects a Warrior spec that names the Magus staff (05 §12 WeaponAllowedRule)', () => {
    expect(RULE.check({ ...KNIGHT, primaryWeaponId: 'magus-staff' })).toEqual([
      'primaryWeaponId "magus-staff" is not allowed for class "warrior"',
    ]);
  });

  it('skips a spec whose class is not a loaded Legend class (SpecClassExistsRule reports it)', () => {
    expect(RULE.check({ ...ORACLE, classId: 'harbinger' })).toEqual([]);
  });

  it('skips a weapon id that names no weapon (KnownSpecWeaponRule reports it)', () => {
    expect(RULE.check({ ...KNIGHT, primaryWeaponId: 'nope' })).toEqual([]);
  });
});
