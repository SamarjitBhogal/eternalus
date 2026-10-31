import type { EntityDefinitionBase } from '../EntityDefinition.types';
import type { MovementProfile } from '../units/units.types';

/** A fast mover fired by a weapon or ability. Damage and on-hit effects arrive with combat (Phase 2). */
export type ProjectileDefinition = EntityDefinitionBase & {
  /** Which entity class builds it. */
  readonly kind: 'projectile';
  /** Collider circle radius in world units. */
  readonly footprintRadius: number;
  readonly movementProfile: MovementProfile;
};
