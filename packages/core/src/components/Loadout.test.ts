import { describe, expect, it } from 'vitest';

import type { MeleeAttack, RangedAttack } from '../content/units/units.types';
import { Loadout } from './Loadout';
import type { HeldWeapon } from './Loadout.types';

const CLAW: MeleeAttack = { strategy: 'melee', damage: 45, reach: 3, interval: 21 };
const ARROW: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 45,
  reach: 50,
  interval: 21,
  projectile: { projectileId: 'arrow', falloff: null },
};
const TALONS: HeldWeapon = { weaponId: 'raptor-talons', attacks: { basic: CLAW, melee: CLAW } };
const BOW: HeldWeapon = { weaponId: 'obsidian-bow', attacks: { basic: ARROW } };

describe('Loadout', () => {
  it('holds the primary weapon at spawn', () => {
    const loadout = new Loadout(TALONS, BOW);

    expect(loadout.inHand).toBe(TALONS);
    expect(loadout.isSecondaryInHand).toBe(false);
  });

  it('swaps to the second weapon and back (DEC-303)', () => {
    const loadout = new Loadout(TALONS, BOW);

    expect(loadout.swap()).toBe(BOW);
    expect(loadout.inHand).toBe(BOW);
    expect(loadout.isSecondaryInHand).toBe(true);
    expect(loadout.swap()).toBe(TALONS);
    expect(loadout.inHand).toBe(TALONS);
    expect(loadout.isSecondaryInHand).toBe(false);
  });

  it('changes nothing and returns null when there is no second weapon', () => {
    const loadout = new Loadout(TALONS, null);

    expect(loadout.swap()).toBeNull();
    expect(loadout.inHand).toBe(TALONS);
    expect(loadout.isSecondaryInHand).toBe(false);
  });
});
