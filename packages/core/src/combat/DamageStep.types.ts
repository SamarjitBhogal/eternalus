import type { EntityId } from '../state/EntityStore.types';
import type { DamageSource } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Where a hit came from, in world units (DEC-381). The body-part bonuses read it
 * (`BodyPartBonusStep`).
 */
export type HitPath = {
  /** Where the hit came from: the melee attacker's position, or where a shot started. */
  readonly origin: Vec2;
  /** Where a shot struck; a melee hit leaves it out. */
  readonly impactPoint?: Vec2;
};

/** One hit on its way through the pipeline. */
export type DamageHit = {
  readonly targetId: EntityId;
  /** The amount after the steps before this one. */
  readonly amount: number;
  readonly source: DamageSource;
  /** Where the hit came from; a hit from no side (a status tick, a blast, a collapse) has none. */
  readonly path?: HitPath;
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
