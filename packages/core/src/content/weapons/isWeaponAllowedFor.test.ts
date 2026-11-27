import { describe, expect, it } from 'vitest';

import { isWeaponAllowedFor } from './isWeaponAllowedFor';

describe('isWeaponAllowedFor', () => {
  it('allows a weapon open to any class and unique to none', () => {
    expect(isWeaponAllowedFor({ allowedClasses: 'any', uniqueTo: null }, 'warrior')).toBe(true);
  });

  it('allows a class that allowedClasses lists, and rejects one it does not list', () => {
    const forWarriors = { allowedClasses: ['warrior'], uniqueTo: null } as const;

    expect(isWeaponAllowedFor(forWarriors, 'warrior')).toBe(true);
    expect(isWeaponAllowedFor(forWarriors, 'magus')).toBe(false);
  });

  it('allows the class a weapon is unique to, and rejects every other class', () => {
    const warriorOnly = { allowedClasses: 'any', uniqueTo: 'warrior' } as const;

    expect(isWeaponAllowedFor(warriorOnly, 'warrior')).toBe(true);
    expect(isWeaponAllowedFor(warriorOnly, 'sentinel')).toBe(false);
  });

  it('rejects a class that allowedClasses leaves out, with no uniqueTo (critic r2, R2-2)', () => {
    expect(isWeaponAllowedFor({ allowedClasses: ['magus'], uniqueTo: null }, 'warrior')).toBe(
      false,
    );
  });

  it('rejects a class that uniqueTo leaves out, when allowedClasses is any (critic r2, R2-2)', () => {
    expect(isWeaponAllowedFor({ allowedClasses: 'any', uniqueTo: 'magus' }, 'warrior')).toBe(false);
  });
});
