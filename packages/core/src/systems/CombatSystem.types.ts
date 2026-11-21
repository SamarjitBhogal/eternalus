import type { DamagePipeline } from '../combat/DamagePipeline';
import type { EntityFactory } from '../entities/EntityFactory';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { HitRunner } from '../state/HitRunner.types';

/** What `CombatSystem` is built from. */
export type CombatSystemOptions = {
  /** The match's one damage pipeline, shared with every system that deals damage. */
  readonly damage: DamagePipeline;
  /** The match's one entity factory: it builds the projectiles ranged attacks fire. */
  readonly factory: EntityFactory;
  /**
   * Runs the attacker's statuses' `onHit` steps when an attack lands, handed to the attack
   * strategy; none run when omitted.
   */
  readonly hits?: HitRunner | null;
  /** The strategy registry; attacks use `strategies.attack`. The default registry when omitted. */
  readonly strategies?: StrategyRegistry;
};
