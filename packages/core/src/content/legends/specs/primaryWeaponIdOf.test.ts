import { describe, expect, it } from 'vitest';

import { WARRIOR } from '../warrior';
import { KNIGHT } from './knight';
import { primaryWeaponIdOf } from './primaryWeaponIdOf';

describe('primaryWeaponIdOf', () => {
  it("is the spec's own weapon when it has one", () => {
    expect(primaryWeaponIdOf({ ...KNIGHT, primaryWeaponId: 'dual-blades' }, WARRIOR)).toBe(
      'dual-blades',
    );
  });

  it("is the class's weapon for a spec with no weapon of its own", () => {
    expect(primaryWeaponIdOf({ ...KNIGHT, primaryWeaponId: null }, WARRIOR)).toBe('raptor-talons');
  });

  it("is the class's weapon when no spec is named", () => {
    expect(primaryWeaponIdOf(null, WARRIOR)).toBe('raptor-talons');
  });
});
