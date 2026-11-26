import type { Vec2 } from '../utils/geometry.types';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';

/** Where a summoned body stands and which way it faces (a unit vector). */
export type SummonPlacement = { readonly position: Vec2; readonly facing: Vec2 };

/**
 * Whatever puts a summoned body into the match and takes one out (architecture 05 §3 `summon`):
 * an ability's `summon` step goes through it. `entities/EntitySummoner` satisfies it. A port in
 * `state/` because `abilities/` may not import `entities/` (02 §2), as `ShotLauncher` is.
 */
export interface Summoner {
  /**
   * Builds the body `definitionId` at `placement`, owned by `ownerId` (the `Summoned` component,
   * there before the body joins the match), adds it, makes a solid outline a wall
   * (`GameState.walls`) and announces it (`entity-spawned`).
   *
   * @returns The new body's id.
   */
  summon(
    state: GameState,
    definitionId: string,
    placement: SummonPlacement,
    ownerId: EntityId,
  ): EntityId;
  /** Takes the body `entityId` out of the match as `despawned` and announces it. */
  despawn(state: GameState, entityId: EntityId): void;
}
