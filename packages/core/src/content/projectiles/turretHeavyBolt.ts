import type { ProjectileDefinition } from './projectiles.types';

/**
 * A wall turret's heavy bolt (architecture 07 §5, DEC-302): a slower shot at one target, no
 * splash. It flies straight until it hits something, or fizzles out at its range like the Magus
 * bolt.
 *
 * TUNE: `acceleration` and `mass` are not tuning: `MovementProfile` requires them, the loader
 * overwrites the first and flight ignores the second.
 */
export const TURRET_HEAVY_BOLT = {
  id: 'turret-heavy-bolt',
  kind: 'projectile',
  displayName: 'Turret Heavy Bolt',
  footprintRadius: 0.15, // TUNE: architecture 10 §1 table (projectile (bolt) 0.15 m)
  movementProfile: {
    maxSpeed: 24, // TUNE: m/s, balancing.md "Turrets — MVP" (heavy ammo)
    acceleration: 24, // Required by `MovementProfile`; `loadProjectiles` overwrites it with the top speed (full speed in tick 1)
    mass: 0.05, // Required by `MovementProfile`; flight does not read it, any positive value
  },
  // TUNE: no reference value. A bolt starts at the turret's centre, so it covers the 8 m pylon, the
  // 14 m range and the lead on a Sentinel at full speed (about 33 m). Owner question pending: does
  // a bolt end at its aim point (INBOX.md HC-Q93)?
  range: 35,
  slowFrom: 35, // equal to range: a bolt flies at full speed until it fizzles
  endDuration: 0.4, // TUNE: no reference value; seconds, as the Magus bolt's mist
} as const satisfies ProjectileDefinition;
