import type { AuthoredProjectile } from './projectiles.types';

/**
 * The Magus staff's bolt (reference 07, 05 §10): a small fast shot that flies straight until it
 * hits something, or fizzles out into a mist at its range (DEC-306).
 *
 * TUNE: every number is a placeholder. `acceleration` and `mass` are not tuning: `MovementProfile`
 * requires them, the loader overwrites the first and flight ignores the second.
 */
export const MAGUS_BOLT = {
  id: 'magus-bolt',
  kind: 'projectile',
  displayName: 'Magus Bolt',
  footprintRadius: 0.15, // TUNE: architecture 10 §1 table (projectile (bolt) 0.15 m)
  movementProfile: {
    maxSpeed: 60, // TUNE: m/s, speed 60 m/s accepted in DEC-310
    acceleration: 60, // Required by `MovementProfile`; `loadProjectiles` overwrites it with the top speed (full speed in tick 1)
    mass: 0.05, // Required by `MovementProfile`; flight does not read it, any positive value
  },
  range: 100, // TUNE: metres; owner words in DEC-306 "after 100m, they could 'fizzle out'"
  slowFrom: 100, // TUNE: metres; equal to range, so no slowing: a bolt flies at full speed until it fizzles (DEC-306)
  endDuration: 0.4, // TUNE: seconds the mist stays; proposed, "tunable" in DEC-306
} as const satisfies AuthoredProjectile;
