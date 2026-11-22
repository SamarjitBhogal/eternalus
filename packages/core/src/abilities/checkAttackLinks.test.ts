import { describe, expect, it } from 'vitest';

import { loadAbilities } from '../content/abilities/loadAbilities';
import { ContentValidationError } from '../content/ContentValidationError';
import { loadTurrets } from '../content/structures/loadTurrets';
import type { AbilityEffectSpec } from '../content/abilities/AbilityDefinition.types';
import type { UnitAttack } from '../content/units/units.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { checkAttackLinks } from './checkAttackLinks';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';

const WEAPONS = loadWeapons(30);
const AMMO = loadTurrets(30).ammo;
const registry = createDefaultAbilityRegistry(loadAbilities(30), 30);
const STAFF = WEAPONS.get('magus-staff');
const HEAVY = AMMO.get('bolt-heavy');
const KNOCKBACK_ON_HIT = { kind: 'knockback', distance: 1, shape: { kind: 'hit' } } as const;

/** `attack` with `onHit` steps. */
const withOnHit = <A extends UnitAttack>(attack: A, onHit: readonly AbilityEffectSpec[]): A => ({
  ...attack,
  onHit,
});

describe('checkAttackLinks', () => {
  it("passes the shipped weapons and turret ammo: the heavy bolt's concussion is known", () => {
    expect(() => {
      checkAttackLinks(registry, WEAPONS.all(), AMMO.all());
    }).not.toThrow();
  });

  it("rejects a weapon attack's onHit step with no strategy, or one its strategy refuses", () => {
    const [first, ...rest] = STAFF.attacks;
    if (first === undefined) throw new Error('The staff has no attack.');
    const shortPush = {
      ...STAFF,
      attacks: [withOnHit(first, [{ ...KNOCKBACK_ON_HIT, distance: 0 }]), ...rest],
    };
    const knockback = { ...STAFF, attacks: [withOnHit(first, [KNOCKBACK_ON_HIT]), ...rest] };

    expect(() => {
      checkAttackLinks(testAbilityRegistry([]), [knockback], []);
    }).toThrow(ContentValidationError);
    expect(() => {
      checkAttackLinks(testAbilityRegistry([]), [knockback], []);
    }).toThrow(
      'Weapon "magus-staff" attack 1 onHit names effect "knockback" with no registered strategy',
    );
    expect(() => {
      checkAttackLinks(registry, [shortPush], []);
    }).toThrow('Weapon "magus-staff" attack 1 onHit: knockback distance must be positive.');
  });

  it("rejects a turret ammo's onHit step with no strategy", () => {
    expect(() => {
      checkAttackLinks(testAbilityRegistry([]), [], [HEAVY]);
    }).toThrow('Turret ammo "bolt-heavy" onHit names effect "debuff" with no registered strategy');
  });

  it('names every problem of every weapon and ammo in one error', () => {
    const [first, ...rest] = STAFF.attacks;
    if (first === undefined) throw new Error('The staff has no attack.');
    const shortPush = withOnHit(first, [{ ...KNOCKBACK_ON_HIT, distance: 0 }]);
    const brokenAmmo = {
      ...HEAVY,
      attack: withOnHit(HEAVY.attack, [{ ...KNOCKBACK_ON_HIT, distance: 0 }]),
    };

    expect(() => {
      checkAttackLinks(
        registry,
        [{ ...STAFF, attacks: [first, shortPush, ...rest] }],
        [brokenAmmo],
      );
    }).toThrow(
      /Weapon "magus-staff" attack 2 onHit: knockback[^]*Turret ammo "bolt-heavy" onHit: knockback/,
    );
  });
});
