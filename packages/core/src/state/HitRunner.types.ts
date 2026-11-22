import type { UnitAttack } from '../content/units/units.types';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';

/**
 * Whatever runs the effects of a landed hit (the attack's own `onHit`, then the attacker's
 * statuses', architecture 05 §8 and §10): after a melee hit (`entities/strategies`) and after a
 * shot lands (`combat/WeaponImpact`). `abilities/HitEffects` satisfies it. A port in `state/`
 * because neither `entities/` nor `combat/` may import `abilities/`, and both may import `state/`
 * (02 §2).
 */
export type HitRunner = {
  /**
   * @param attack - The attack that struck (a shot's is the one it was fired with); absent runs
   *   only the statuses' `onHit`.
   */
  afterHit(state: GameState, attackerId: EntityId, targetId: EntityId, attack?: UnitAttack): void;
};
