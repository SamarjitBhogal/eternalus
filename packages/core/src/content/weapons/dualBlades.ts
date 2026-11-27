import type { AuthoredWeaponDefinition } from './weapons.types';

/**
 * Dual Blades: two swords (DEC-57), fast melee physical with a short reach. They are reference 07's
 * "Short blades" (DEC-64), the Warrior's unique weapon (reference 07 unique weapons, 05 §10 table).
 * The Templar starts with them. One arc per swing: no two-arc dual wield (DEC-304) and no throwing
 * (DEC-374 (W2)).
 *
 * TUNE: every number was set by the owner in DEC-374 (W2).
 */
export const DUAL_BLADES = {
  id: 'dual-blades',
  displayName: 'Dual Blades',
  weaponClass: 'sword',
  attacks: [
    {
      strategy: 'melee-sweep',
      damage: 30, // TUNE: DEC-374 (W2)
      reach: 1, // TUNE: DEC-305, DEC-374 (W2): short blades; the class adds its own (`LegendDefinition.meleeReach`)
      interval: 0.45, // TUNE: DEC-374 (W2)
      arcDegrees: 100, // TUNE: DEC-304, DEC-374 (W2)
    },
  ],
  // Warrior only: reference 07 unique weapons (Warrior: short blades), DEC-64, 05 §10 table
  allowedClasses: ['warrior'],
  uniqueTo: 'warrior',
} as const satisfies AuthoredWeaponDefinition;
