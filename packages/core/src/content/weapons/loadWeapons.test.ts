import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadWeapons } from './loadWeapons';
import type { ProjectileLaunch } from '../units/units.types';
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

/** A stand-in ranged weapon whose shot is `projectile` with `launch` fields changed. */
const shooting = (
  launch: Partial<ProjectileLaunch['falloff'] & object> | null,
  projectileId = 'arrow',
): WeaponDefinition => ({
  ...TEST_TALONS,
  weaponClass: 'bow',
  attacks: [
    {
      strategy: 'ranged-projectile',
      damage: 50,
      reach: 30,
      interval: 0.5,
      projectile: {
        projectileId,
        falloff: launch === null ? null : { fullTo: 30, floorAt: 60, floor: 0.5, ...launch },
      },
    },
  ],
});

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

  it('ships each class default weapon', () => {
    expect(loadWeapons(30).ids).toEqual([
      'raptor-talons',
      'wuuthrad',
      'magus-staff',
      'obsidian-bow',
    ]);
  });

  it('keeps the staff ranged attack first, the default, and its melee attack second (DEC-308)', () => {
    const { attacks } = loadWeapons(30).get('magus-staff');

    expect(attacks.map(({ strategy }) => strategy)).toEqual(['ranged-projectile', 'melee-sweep']);
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

  it('ships the DEC-304 arcs and the DEC-305 weapon reach parts', () => {
    const weapons = loadWeapons(30);
    const sweep = (id: string, index = 0) => {
      const attack = weapons.get(id).attacks[index];
      return attack?.strategy === 'melee-sweep' ? [attack.arcDegrees, attack.reach] : undefined;
    };

    expect(sweep('raptor-talons')).toEqual([90, 1]);
    expect(sweep('wuuthrad')).toEqual([160, 2]);
    expect(sweep('magus-staff', 1)).toEqual([90, 1]);
  });

  it.each([0, -10, 181, 360, Number.NaN])('rejects a sweep arc of %s degrees', (arcDegrees) => {
    const sweepWeapon: WeaponDefinition = {
      ...TEST_TALONS,
      attacks: [{ strategy: 'melee-sweep', damage: 50, reach: 1, interval: 0.5, arcDegrees }],
    };

    expect(() => loadWeapons(30, [sweepWeapon])).toThrow(
      'Weapon "test-talons": sweep arcDegrees must be above 0 and at most 180',
    );
  });

  it.each([1, 90, 180])('accepts a sweep arc of %s degrees', (arcDegrees) => {
    const sweepWeapon: WeaponDefinition = {
      ...TEST_TALONS,
      attacks: [{ strategy: 'melee-sweep', damage: 50, reach: 1, interval: 0.5, arcDegrees }],
    };

    expect(() => loadWeapons(30, [sweepWeapon])).not.toThrow();
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

  it('accepts a ranged weapon with a falloff or none, and keeps the shot', () => {
    expect(loadWeapons(30, [shooting({})]).get('test-talons').attacks[0]).toMatchObject({
      projectile: { projectileId: 'arrow', falloff: { fullTo: 30, floorAt: 60, floor: 0.5 } },
    });
    expect(() => loadWeapons(30, [shooting(null)])).not.toThrow();
  });

  it('rejects a ranged attack that fires an unknown projectile', () => {
    expect(() => loadWeapons(30, [shooting({}, 'no-such-shot')])).toThrow(
      'Weapon "test-talons": unknown projectile "no-such-shot".',
    );
  });

  it.each([
    ['fullTo is zero', { fullTo: 0 }],
    ['fullTo is not below floorAt', { fullTo: 60 }],
    ['floorAt is infinite', { floorAt: Infinity }],
  ])('rejects a falloff when %s', (_, falloff) => {
    expect(() => loadWeapons(30, [shooting(falloff)])).toThrow(
      'falloff needs 0 < fullTo < floorAt',
    );
  });

  it.each([0, -0.1, 1.5])('rejects a falloff floor of %s', (floor) => {
    expect(() => loadWeapons(30, [shooting({ floor })])).toThrow('falloff floor must be in (0, 1]');
  });
});
