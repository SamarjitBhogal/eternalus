import type { AuthoredWeaponDefinition } from './weapons.types';

/**
 * Bastions: reference 07's Barricades, renamed (DEC-64). A walled shield on each arm, so they are
 * dual-wielded like the dual blades (the owner's note on DEC-407: "Cabrakan design"). The
 * Sentinel's unique weapon (reference 07 unique weapons, 05 §10 table), of the weapon class
 * `shield` (DEC-407). The Colossus starts with them. One arc per swing, as the dual blades
 * (DEC-304). Reference 07's movement lock, mass change, moving collider and knock-back absorption
 * are not built: they stay post-MVP ("needs work", 05 §10 table).
 *
 * TUNE: every number was set by the owner in DEC-387 (W3).
 */
export const BASTIONS = {
  id: 'bastions',
  displayName: 'Bastions',
  weaponClass: 'shield',
  attacks: [
    {
      strategy: 'melee-sweep',
      damage: 120, // TUNE: DEC-387 (W3)
      reach: 1, // TUNE: DEC-305, DEC-387 (W3); the class adds its own (`LegendDefinition.meleeReach`)
      interval: 1.6, // TUNE: DEC-387 (W3)
      arcDegrees: 70, // TUNE: DEC-304, DEC-387 (W3)
    },
  ],
  // Sentinel only: reference 07 unique weapons (Sentinel: Barricades), DEC-64, 05 §10 table
  allowedClasses: ['sentinel'],
  uniqueTo: 'sentinel',
} as const satisfies AuthoredWeaponDefinition;
