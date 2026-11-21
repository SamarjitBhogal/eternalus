import type { ProjectileDefinition } from './projectiles.types';

/**
 * The Magus staff's bolt (reference 07, 05 §10): a small fast shot that flies straight until it
 * hits something, or fizzles out into a mist at its range (DEC-306).
 *
 * TUNE: every number is a placeholder.
 */
export const MAGUS_BOLT = {
  id: 'magus-bolt',
  kind: 'projectile',
  displayName: 'Magus Bolt',
  footprintRadius: 0.15, // TUNE: architecture 10 table (bolt radius 0.15 m); DEC-310
  movementProfile: {
    maxSpeed: 60, // TUNE: m/s, speed 60 m/s accepted in DEC-310
    acceleration: 60, // TUNE: m/s; the loader sets it equal to top speed so a shot is at full speed in tick 1
    mass: 0.05, // TUNE: unused by flight; any positive value; DEC-310
  },
  range: 100, // TUNE: metres; owner words in DEC-306 "after 100m, they could 'fizzle out'"
  slowFrom: 100, // TUNE: metres; equal to range, so no slowing: a bolt flies at full speed until it fizzles (DEC-306)
  endDuration: 0.4, // TUNE: seconds the mist stays; proposed, "tunable" in DEC-306
} as const satisfies ProjectileDefinition;
