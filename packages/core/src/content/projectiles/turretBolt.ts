import type { ProjectileDefinition } from './projectiles.types';

/**
 * A wall turret's default bolt (architecture 07 §5, DEC-302): a fast shot at one target, no splash.
 * It is an arc shot (DEC-341 (4), DEC-342): it flies over walls and bodies to its aim point, lands
 * there and lodges in the ground.
 *
 * TUNE: `acceleration` and `mass` are not tuning: `MovementProfile` requires them, the loader
 * overwrites the first and flight ignores the second.
 */
export const TURRET_BOLT = {
  id: 'turret-bolt',
  kind: 'projectile',
  displayName: 'Turret Bolt',
  footprintRadius: 0.15, // TUNE: architecture 10 §1 table (projectile (bolt) 0.15 m)
  movementProfile: {
    maxSpeed: 30, // TUNE: m/s, balancing.md "Turrets — MVP" (default ammo)
    acceleration: 30, // Required by `MovementProfile`; `loadProjectiles` overwrites it with the top speed (full speed in tick 1)
    mass: 0.05, // Required by `MovementProfile`; flight does not read it, any positive value
  },
  // TUNE: no reference value. A bolt starts at the turret's centre, so it covers the 8 m pylon, the
  // 14 m range and the lead on a Sentinel at full speed (about 33 m). DEC-341 (HC-Q93): a bolt
  // arcs down onto its aim point and lodges there (`isArc`, DEC-341 (4)); its range is the cap, and
  // the shot flies only as far as its aim point.
  range: 35,
  slowFrom: 35, // equal to range: a bolt flies at full speed until it lands at its aim point
  isArc: true,
  endDuration: 0.4, // TUNE: no reference value; seconds, as the Magus bolt's mist
} as const satisfies ProjectileDefinition;
