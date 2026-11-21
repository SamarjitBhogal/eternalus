import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';

/**
 * Whether a unit's shot would reach its target now (architecture 05 §10, DEC-317). A bot holds to
 * shoot only with a clear line, and `CombatSystem` fires a ranged attack only with one. A port so
 * `ai/` reads it without the projectile content and tests can stand it in; `LineOfFire` is the
 * match's one.
 */
export interface LineOfFireQuery {
  /**
   * Whether a shot that `attackerId`'s current attack fires now at `targetId` would touch the
   * target within the shot's `range` and before a wall or the map's edge stops it, by the contact
   * rule `ProjectileSystem` lands shots by. Units on the line are not read: they may move. `true`
   * for an attack that fires no projectile (melee), an unknown attacker or target, a target with no
   * point to aim at (`EntityStore.aimPointOf` gives `null`), and a match with no collision rule,
   * so a melee unit is never held back by it.
   */
  isClear(state: GameState, attackerId: EntityId, targetId: EntityId): boolean;
}
