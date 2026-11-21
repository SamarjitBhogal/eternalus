import type { WeaponDefinition } from './weapons.types';

/**
 * Staff: melee physical, ranged magical (reference 07, 05 §10), unique to the Magus and its default
 * weapon. The ranged attack is first, so it is the default attack (DEC-308); the melee attack is
 * used on its own rebindable action, `attack-target` with `mode: 'melee'` (DEC-308).
 *
 * TUNE: damage, interval and firing reach accepted in DEC-310; fall-off in DEC-306. `grants:
 * ['spell-potency']` joins with its status.
 */
export const MAGUS_STAFF = {
  id: 'magus-staff',
  displayName: 'Staff',
  weaponClass: 'staff',
  attacks: [
    {
      strategy: 'ranged-projectile',
      damage: 40, // TUNE: balancing.md Magus (40 / 0.9 s, magical); DEC-310
      reach: 15, // TUNE: owner 2026-10-19 "damage fall-off after 15 m" (bots close to it and deal about full damage, 98.8 %: fall-off runs from the shooter's centre); DEC-310
      interval: 0.9, // TUNE: balancing.md Magus (0.9 s); DEC-310
      projectile: {
        projectileId: 'magus-bolt',
        falloff: { fullTo: 15, floorAt: 45, floor: 0.4 }, // TUNE: fall-off starts at 15 m (owner 2026-10-19); floorAt and floor are guesses; accepted in DEC-306
      },
    },
    {
      strategy: 'melee-sweep',
      damage: 40, // TUNE: balancing.md Magus; kept by DEC-308 on its own rebindable action (default F)
      reach: 1, // TUNE: DEC-305, the weapon's part; the class adds its own (`LegendDefinition.meleeReach`)
      interval: 0.9, // TUNE: balancing.md Magus (0.9 s)
      arcDegrees: 90, // TUNE: DEC-304
    },
  ],
  allowedClasses: ['magus'],
  uniqueTo: 'magus',
} as const satisfies WeaponDefinition;
