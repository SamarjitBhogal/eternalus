import type { ProjectileDefinition } from './projectiles.types';

/**
 * The blade Hamstring throws (DEC-268): fast, narrow and visible in flight. It flies at full speed
 * to its range and falls to the ground there: proposed, the arrow's look (DEC-306).
 *
 * TUNE: every number is a placeholder. `acceleration` and `mass` are not tuning: `MovementProfile`
 * requires them, the loader overwrites the first and flight ignores the second.
 */
export const HAMSTRING_BLADE = {
  id: 'hamstring-blade',
  kind: 'projectile',
  displayName: 'Hamstring Blade',
  footprintRadius: 0.15, // TUNE: half of the 0.3 m width of DEC-268
  movementProfile: {
    maxSpeed: 30, // TUNE: m/s, DEC-268
    // Required by `MovementProfile`; `loadProjectiles` overwrites it with the top speed (full
    // speed in tick 1)
    acceleration: 30,
    mass: 0.05, // Required by `MovementProfile`; flight does not read it, any positive value
  },
  range: 12, // TUNE: metres, balancing.md:184 ("thrown blade, 12 m"); DEC-268: 12 m in 0.4 s
  slowFrom: 12, // TUNE: equal to range, so full speed to the end: 12 m in 0.4 s at 30 m/s (DEC-268)
  endDuration: 1, // TUNE: seconds the blade lies on the ground; proposed, the arrow's value (DEC-306)
} as const satisfies ProjectileDefinition;
