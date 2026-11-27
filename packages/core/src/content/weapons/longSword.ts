import type { AuthoredWeaponDefinition } from './weapons.types';

/**
 * Long Sword: a sword, melee physical, open to every class (reference 07 "Weapon classes"). It is a
 * catalogue weapon: no Legend starts with it (DEC-374 (W4)).
 *
 * TUNE: every number was set by the owner in DEC-374 (W1).
 */
export const LONG_SWORD = {
  id: 'long-sword',
  displayName: 'Long Sword',
  weaponClass: 'sword',
  attacks: [
    {
      strategy: 'melee-sweep',
      damage: 60, // TUNE: DEC-374 (W1)
      reach: 2, // TUNE: DEC-305, DEC-374 (W1); the class adds its own (`LegendDefinition.meleeReach`)
      interval: 0.9, // TUNE: DEC-374 (W1)
      arcDegrees: 120, // TUNE: DEC-304, DEC-374 (W1)
    },
  ],
  allowedClasses: 'any',
  uniqueTo: null,
} as const satisfies AuthoredWeaponDefinition;
