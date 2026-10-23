import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { KnownWeaponRule } from './KnownWeaponRule';

const WARRIOR = LEGEND_CLASSES.get('warrior');
const WEAPONS = { has: (id: string): boolean => id === 'test-talons' };

describe('KnownWeaponRule', () => {
  it('accepts a unit that names no weapon', () => {
    expect(new KnownWeaponRule(WEAPONS).check(WARRIOR)).toEqual([]);
  });

  it('accepts a Legend whose default weapon exists', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'test-talons' } };

    expect(new KnownWeaponRule(WEAPONS).check(armed)).toEqual([]);
  });

  it('flags a default weapon that names no weapon', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'nope' } };

    expect(new KnownWeaponRule(WEAPONS).check(armed)).toEqual([
      'defaultLoadout.primaryWeaponId "nope" names no weapon',
    ]);
  });
});
