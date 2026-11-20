import { loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { classLoadoutOptions } from './classLoadoutOptions';

describe('classLoadoutOptions', () => {
  const options = classLoadoutOptions(loadDisplayContent());

  it('gives every playable class its options, and only those', () => {
    expect(Object.keys(options)).toEqual(loadDisplayContent().legends.map((legend) => legend.id));
  });

  it("offers the non-unique weapons to every class and the Magus's Staff to the Magus alone", () => {
    expect(options.warrior?.weapons.map((weapon) => weapon.id)).toEqual([
      'raptor-talons',
      'wuuthrad',
    ]);
    expect(options.magus?.weapons.map((weapon) => weapon.id)).toEqual([
      'raptor-talons',
      'wuuthrad',
      'magus-staff',
    ]);
    expect(options.magus?.weapons[2]).toEqual({ id: 'magus-staff', displayName: 'Staff' });
  });

  it('defaults each class to its content default weapon, which it may carry', () => {
    for (const legend of loadDisplayContent().legends) {
      const classOptions = options[legend.id];
      expect(classOptions?.defaultWeaponId).toBe(legend.defaultLoadout.primaryWeaponId);
      expect(classOptions?.weapons.map((weapon) => weapon.id)).toContain(
        classOptions?.defaultWeaponId,
      );
    }
  });
});
