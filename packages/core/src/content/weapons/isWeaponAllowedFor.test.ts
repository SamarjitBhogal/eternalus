import { describe, expect, it } from 'vitest';

import { isWeaponAllowedFor } from './isWeaponAllowedFor';
import { WEAPONS } from './weaponCatalogue';

describe('isWeaponAllowedFor', () => {
  it('lets every class carry a non-unique weapon', () => {
    for (const classId of ['warrior', 'sentinel', 'magus']) {
      expect(isWeaponAllowedFor(WEAPONS.get('raptor-talons'), classId)).toBe(true);
    }
  });

  it('keeps a unique weapon to the classes it allows', () => {
    expect(isWeaponAllowedFor(WEAPONS.get('magus-staff'), 'magus')).toBe(true);
    expect(isWeaponAllowedFor(WEAPONS.get('magus-staff'), 'warrior')).toBe(false);
  });

  it('refuses a class content does not have', () => {
    expect(isWeaponAllowedFor({ allowedClasses: ['magus'] }, 'harbinger')).toBe(false);
  });
});
