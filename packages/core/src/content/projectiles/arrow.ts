import type { ProjectileDefinition } from './projectiles.types';

/**
 * An arrow (reference 07, 05 §10): the bow's shot. It flies straight until it hits something, or
 * slows near its range and falls to the ground there with a shadow below it (DEC-306).
 *
 * TUNE: every number is a placeholder.
 */
export const ARROW = {
  id: 'arrow',
  kind: 'projectile',
  displayName: 'Arrow',
  footprintRadius: 0.15, // TUNE: architecture 10 table (bolt radius 0.15 m); DEC-310
  movementProfile: {
    maxSpeed: 60, // TUNE: m/s, speed 60 m/s accepted in DEC-310
    acceleration: 60, // TUNE: m/s; the loader sets it equal to top speed so a shot is at full speed in tick 1
    mass: 0.05, // TUNE: unused by flight; any positive value; DEC-310
  },
  range: 100, // TUNE: metres; "bows can have a max distance where the arrow falls to the ground" (DEC-306), value is a guess
  slowFrom: 80, // TUNE: metres; the bow's fall-off floor distance, so the arrow drops while it is at floor damage (DEC-306)
  endDuration: 1, // TUNE: seconds the arrow lies on the ground; proposed, "tunable" in DEC-306
} as const satisfies ProjectileDefinition;
