import { describe, expect, it } from 'vitest';

import { isWeaponAllowedFor } from './isWeaponAllowedFor';

describe('isWeaponAllowedFor', () => {
  it('allows a non-unique weapon for any class', () => {
    expect(isWeaponAllowedFor({ allowedClasses: 'any', uniqueTo: null }, 'warrior')).toBe(true);
  });

  it('allows a class-listed weapon only for the listed classes', () => {
    const weapon = { allowedClasses: ['magus'], uniqueTo: null } as const;

    expect(isWeaponAllowedFor(weapon, 'magus')).toBe(true);
    expect(isWeaponAllowedFor(weapon, 'warrior')).toBe(false);
  });

  it('refuses a unique weapon to every other class', () => {
    const weapon = { allowedClasses: 'any', uniqueTo: 'magus' } as const;

    expect(isWeaponAllowedFor(weapon, 'magus')).toBe(true);
    expect(isWeaponAllowedFor(weapon, 'warrior')).toBe(false);
  });
});
