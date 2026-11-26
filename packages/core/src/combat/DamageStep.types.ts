import type { EntityId } from '../state/EntityStore.types';
import type { DamageSource } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';

/** One hit on its way through the pipeline. */
export type DamageHit = {
  readonly targetId: EntityId;
  /** The amount after the steps before this one. */
  readonly amount: number;
  readonly source: DamageSource;
  /**
   * Where a projectile struck, in world units; a hit with no impact point (melee, a status tick)
   * leaves it out. The head-shot bonus reads it (`BodyPartBonusStep`, DEC-381).
   */
  readonly impactPoint?: Vec2;
};

/**
 * One rule that changes a hit before it reaches `Health` (architecture 05 §9): friendly fire,
 * statuses (`sundered`, `enraged`), structure multipliers, breakability. A new rule is one class
 * plus one line in `defaultDamageSteps.ts`; the pipeline itself never changes.
 */
export interface DamageStep {
  /** A stable name for logs and tests, e.g. `friendly-fire`. */
  readonly name: string;
  /** Returns the hit's new amount; 0 blocks it. */
  adjust(hit: DamageHit, state: GameState): number;
}
