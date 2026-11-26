import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from '../ContentCatalogue';
import { KNIGHT } from '../legends/specs/knight';
import { KnownSpecWeaponRule } from './KnownSpecWeaponRule';

const WEAPONS = new ContentCatalogue([
  { id: 'dual-blades', allowedClasses: ['warrior'], uniqueTo: 'warrior' },
  { id: 'magus-staff', allowedClasses: ['magus'], uniqueTo: 'magus' },
] as const);

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

  it("flags a weapon that the spec's class may not use (05 §12 WeaponAllowedRule)", () => {
    const armed = { ...KNIGHT, primaryWeaponId: 'magus-staff' };

    expect(new KnownSpecWeaponRule(WEAPONS).check(armed)).toEqual([
      'primaryWeaponId "magus-staff" is not allowed for class "warrior"',
    ]);
  });
});
