import type { ProjectilePayloadData } from '../components/ProjectilePayload.types';
import type { Vec2 } from '../utils/geometry.types';
import type { GameState } from './GameState';

/**
 * Whatever puts a shot into the match (architecture 05 §3 `projectile`, §10): an ability's
 * `projectile` step launches through it. `entities/ProjectileLauncher` satisfies it. A port in
 * `state/` because `abilities/` may not import `entities/` (02 §2), as `HitRunner` is one for
 * `entities/` and `combat/`.
 */
export interface ShotLauncher {
  /**
   * Builds the projectile `projectileId` at `payload.origin` for `payload.team`, carrying
   * `payload`, flying along `direction` (a unit vector) from the next tick, and announces it
   * (`entity-spawned`).
   */
  launch(
    state: GameState,
    projectileId: string,
    payload: ProjectilePayloadData,
    direction: Vec2,
  ): void;
}
