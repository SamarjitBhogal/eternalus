import type { EntityId } from '../state/EntityStore.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * A basic attack's hit as `HitEffects` casts its on-hit steps: by the attacker at its level, at
 * the struck body, placed from the attacker's centre to the body's.
 */
export type LandedHit = {
  readonly casterId: EntityId;
  readonly casterLevel: number;
  readonly targetId: EntityId;
  readonly from: Vec2;
  readonly to: Vec2;
};
