import type { ProjectileDefinition } from './projectiles.types';

/** Staff projectile: 24 m/s temporarily approved by the author on 2026-11-11. */
export const MAGUS_BOLT = {
  id: 'magus-bolt',
  kind: 'projectile',
  displayName: 'Aether Bolt',
  // A point projectile; its visible glow has no gameplay radius.
  footprintRadius: Number.EPSILON,
  movementProfile: { maxSpeed: 24, acceleration: 24, mass: 1 }, // TUNE: author-approved travel speed; other movement fields unused by flight integration.
} as const satisfies ProjectileDefinition;
