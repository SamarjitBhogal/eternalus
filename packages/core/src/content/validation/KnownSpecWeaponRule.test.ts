import { describe, expect, it } from 'vitest';

import { KNIGHT } from '../legends/specs/knight';
import { KnownSpecWeaponRule } from './KnownSpecWeaponRule';

const WEAPONS = { has: (id: string): boolean => id === 'dual-blades' };

describe('KnownSpecWeaponRule', () => {
  it('accepts a spec with no weapon of its own', () => {
    expect(new KnownSpecWeaponRule(WEAPONS).check({ ...KNIGHT, primaryWeaponId: null })).toEqual(
      [],
    );
  });

  it('accepts a spec whose weapon exists', () => {
    const armed = { ...KNIGHT, primaryWeaponId: 'dual-blades' };

    expect(new KnownSpecWeaponRule(WEAPONS).check(armed)).toEqual([]);
  });

  it('flags a weapon id that names no weapon', () => {
    const armed = { ...KNIGHT, primaryWeaponId: 'nope' };

    expect(new KnownSpecWeaponRule(WEAPONS).check(armed)).toEqual([
      'primaryWeaponId "nope" names no weapon',
    ]);
  });
});
