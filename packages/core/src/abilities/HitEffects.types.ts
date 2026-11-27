import type { EntityId } from '../state/EntityStore.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * A basic attack's hit as `HitEffects` casts its on-hit steps: by the attacker at its level and
 * for its team, at the struck body, placed from the attacker's centre (or, for a shot whose owner
 * is gone, from where the shot was fired) to the body's.
 */
export type LandedHit = {
  readonly casterId: EntityId;
  readonly casterLevel: number;
  readonly casterTeam: Team | undefined;
  readonly targetId: EntityId;
  readonly from: Vec2;
  readonly to: Vec2;
};
