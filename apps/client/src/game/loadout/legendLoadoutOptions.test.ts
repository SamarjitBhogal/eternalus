import { loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { legendLoadoutOptions } from './legendLoadoutOptions';

const CONTENT = loadDisplayContent();

describe('legendLoadoutOptions', () => {
  const options = legendLoadoutOptions(CONTENT);

  it('gives every Legend its options, keyed by specId (DEC-354 (1)), and leaves its class to core (DEC-418 (2))', () => {
    expect(Object.keys(options)).toEqual(CONTENT.specs.map((spec) => spec.id));
    for (const spec of CONTENT.specs) expect(options[spec.id]).not.toHaveProperty('classId');
  });

  it("offers each Legend its class's weapons: the Magus's Staff to Magus Legends alone", () => {
    expect(options.knight?.weapons.map((weapon) => weapon.id)).toEqual([
      'raptor-talons',
      'wuuthrad',
    ]);
    expect(options.oracle?.weapons.map((weapon) => weapon.id)).toEqual([
      'raptor-talons',
      'wuuthrad',
      'magus-staff',
    ]);
    expect(options.oracle?.weapons[2]).toEqual({ id: 'magus-staff', displayName: 'Staff' });
  });

  it("defaults each Legend to its class's auto-build weapon, which it may carry", () => {
    for (const spec of CONTENT.specs) {
      const legend = CONTENT.legends.find((candidate) => candidate.id === spec.classId);
      const legendOptions = options[spec.id];
      expect(legendOptions?.defaultWeaponId).toBe(legend?.defaultLoadout.primaryWeaponId);
      expect(legendOptions?.weapons.map((weapon) => weapon.id)).toContain(
        legendOptions?.defaultWeaponId,
      );
    }
  });
});
