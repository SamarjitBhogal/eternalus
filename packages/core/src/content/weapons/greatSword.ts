import type { AuthoredWeaponDefinition } from './weapons.types';

/**
 * Great Sword: a sword, melee physical, open to every class. Heavier than the Long Sword: it hits
 * harder and sweeps wider, and it is slower. The Paladin starts with it (DEC-374 (W4)).
 *
 * TUNE: every number was set by the owner in DEC-374 (W4).
 */
export const GREAT_SWORD = {
  id: 'great-sword',
  displayName: 'Great Sword',
  weaponClass: 'sword',
  attacks: [
    {
      strategy: 'melee-sweep',
      damage: 85, // TUNE: DEC-374 (W4)
      reach: 2, // TUNE: DEC-305, DEC-374 (W4); the class adds its own (`LegendDefinition.meleeReach`)
      interval: 1.2, // TUNE: DEC-374 (W4)
      arcDegrees: 140, // TUNE: DEC-304, DEC-374 (W4)
    },
  ],
  allowedClasses: 'any',
  uniqueTo: null,
} as const satisfies AuthoredWeaponDefinition;
