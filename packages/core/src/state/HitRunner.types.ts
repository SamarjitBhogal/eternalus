import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';

/**
 * Whatever runs the effects of a landed hit (a status's `onHit`, architecture 05 §8 and §10):
 * after a melee hit (`entities/strategies`) and after a shot lands (`combat/WeaponImpact`).
 * `abilities/HitEffects` satisfies it. A port in `state/` because neither `entities/` nor
 * `combat/` may import `abilities/`, and both may import `state/` (02 §2).
 */
export type HitRunner = {
  afterHit(state: GameState, attackerId: EntityId, targetId: EntityId): void;
};
