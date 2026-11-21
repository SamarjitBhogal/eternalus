import type { DamagePipeline } from '../combat/DamagePipeline';
import type { EntityFactory } from '../entities/EntityFactory';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { HitRunner } from '../state/HitRunner.types';
import type { LineOfFireQuery } from '../state/LineOfFire.types';

/** What `CombatSystem` is built from. */
export type CombatSystemOptions = {
  /** The match's one damage pipeline, shared with every system that deals damage. */
  readonly damage: DamagePipeline;
  /** The match's one entity factory: it builds the projectiles ranged attacks fire. */
  readonly factory: EntityFactory;
  /**
   * Whether a shot would reach the target now; a ranged attack fires only when it would (DEC-317).
   * Required, so no unit fires into a wall by omission.
   */
  readonly lineOfFire: LineOfFireQuery;
  /**
   * Runs the attacker's statuses' `onHit` steps when an attack lands, handed to the attack
   * strategy; none run when omitted.
   */
  readonly hits?: HitRunner | null;
  /** The strategy registry; attacks use `strategies.attack`. The default registry when omitted. */
  readonly strategies?: StrategyRegistry;
};
