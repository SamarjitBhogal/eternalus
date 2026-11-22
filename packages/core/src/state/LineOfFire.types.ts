import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';

/**
 * Whether a unit's shot would reach its target now (architecture 05 §10, DEC-317). A bot holds a
 * target and stands to shoot only with a clear line; without one it drops the target and moves
 * (DEC-317 addendum). `CombatSystem` does not read it: a unit fires whenever it attacks. A port so
 * `ai/` reads it without the projectile content and tests can stand it in; `LineOfFire` is the
 * match's one.
 */
export interface LineOfFireQuery {
  /**
   * Whether a shot that `attackerId`'s current attack fires now at `targetId` would touch the
   * target within the shot's `range` and before a wall, the map's edge or a body that takes no
   * damage now (a forest camp) stops it, by the rules `ProjectileSystem` flies and lands shots by
   * (`AreaHitQuery.stopsShot`, `isTouchedBeforeWall`). Units on the line are not read: they may
   * move; nor are other bodies that take damage, since the shot lands on them. `true`
   * for an attack that fires no projectile (melee), an unknown attacker or target, a target with no
   * point to aim at (`EntityStore.aimPointOf` gives `null`), and a match with no collision rule,
   * so a melee unit is never held back by it.
   */
  isClear(state: GameState, attackerId: EntityId, targetId: EntityId): boolean;
}
