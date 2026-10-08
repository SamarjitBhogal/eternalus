import type { MovementProfile } from '../units/units.types';

/** A fast mover fired by a weapon or ability. Damage and on-hit effects arrive with combat (Phase 2). */
export type ProjectileDefinition = {
  /** Kebab-case content id; never renamed once used. */
  readonly id: string;
  readonly kind: 'projectile';
  /** The name players see. */
  readonly displayName: string;
  /** Collider circle radius in world units. */
  readonly footprintRadius: number;
  readonly movement: MovementProfile;
};
