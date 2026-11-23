import type { AuthoredProjectile } from './projectiles.types';

/**
 * An arrow (reference 07, 05 §10): the bow's shot. It flies straight until it hits something, or
 * slows near its range and falls to the ground there with a shadow below it (DEC-306). It flies
 * over lakes and lava; over lava it catches fire and burns what it lands on (DEC-345).
 *
 * TUNE: every number is a placeholder. `acceleration` and `mass` are not tuning: `MovementProfile`
 * requires them, the loader overwrites the first and flight ignores the second.
 */
export const ARROW = {
  id: 'arrow',
  kind: 'projectile',
  displayName: 'Arrow',
  footprintRadius: 0.15, // TUNE: architecture 10 §1 table (projectile (bolt) 0.15 m)
  movementProfile: {
    maxSpeed: 60, // TUNE: m/s, speed 60 m/s accepted in DEC-310
    acceleration: 60, // Required by `MovementProfile`; `loadProjectiles` overwrites it with the top speed (full speed in tick 1)
    mass: 0.05, // Required by `MovementProfile`; flight does not read it, any positive value
  },
  range: 100, // TUNE: metres; "bows can have a max distance where the arrow falls to the ground" (DEC-306), value is a guess
  slowFrom: 80, // TUNE: metres; the bow's fall-off floor distance, so the arrow drops while it is at floor damage (DEC-306)
  endDuration: 1, // TUNE: seconds the arrow lies on the ground; proposed, "tunable" in DEC-306
  // An arrow that flew over lava burns what it lands on (HC-Q89, DEC-345). TUNE: 1.2 s is the
  // Cathedral gem's burn (DEC-292, PR #132 `gemBurn.ts`); see `status-effects/burn.ts`.
  litOnHit: [{ kind: 'debuff', statusId: 'burn', durationSeconds: 1.2, shape: { kind: 'hit' } }],
} as const satisfies AuthoredProjectile;
