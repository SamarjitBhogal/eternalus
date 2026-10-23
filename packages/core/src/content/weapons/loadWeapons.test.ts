import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadWeapons } from './loadWeapons';
import type { WeaponDefinition } from './weapons.types';

/** A stand-in melee weapon; the shipped catalogue has no numbers until the owner sets them. */
const TEST_TALONS: WeaponDefinition = {
  id: 'test-talons',
  displayName: 'Test talons',
  weaponClass: 'glove',
  attacks: [{ strategy: 'melee', damage: 50, reach: 1.5, interval: 0.5 }],
  allowedClasses: 'any',
  uniqueTo: null,
};

const withAttack = (field: 'damage' | 'reach' | 'interval', value: number): WeaponDefinition => ({
  ...TEST_TALONS,
  attacks: [{ strategy: 'melee', damage: 50, reach: 1.5, interval: 0.5, [field]: value }],
});

describe('loadWeapons', () => {
  it('converts attack intervals from seconds to ticks, at least one tick', () => {
    expect(loadWeapons(30, [TEST_TALONS]).get('test-talons').attacks[0]?.interval).toBe(15);
    expect(
      loadWeapons(30, [withAttack('interval', 0.01)]).get('test-talons').attacks[0]?.interval,
    ).toBe(1);
  });

  it('ships no weapons until the owner sets their numbers', () => {
    expect(loadWeapons(30).ids).toEqual([]);
  });

  it('rejects a weapon with no attacks', () => {
    expect(() => loadWeapons(30, [{ ...TEST_TALONS, attacks: [] }])).toThrow(
      /Weapon "test-talons": needs at least one attack/,
    );
  });

  it.each(['damage', 'reach', 'interval'] as const)('rejects a non-positive %s', (field) => {
    expect(() => loadWeapons(30, [withAttack(field, 0)])).toThrow(ContentValidationError);
    expect(() => loadWeapons(30, [withAttack(field, 0)])).toThrow(
      `Weapon "test-talons": attack ${field} must be positive`,
    );
  });

  it('rejects an id that is not kebab-case', () => {
    expect(() => loadWeapons(30, [{ ...TEST_TALONS, id: 'Test_Talons' }])).toThrow(
      /Weapon "Test_Talons": id must be kebab-case/,
    );
  });

  it('rejects a unique weapon its own class may not use', () => {
    expect(() =>
      loadWeapons(30, [{ ...TEST_TALONS, uniqueTo: 'magus', allowedClasses: ['warrior'] }]),
    ).toThrow(/Weapon "test-talons": uniqueTo must be in allowedClasses/);
  });
});
