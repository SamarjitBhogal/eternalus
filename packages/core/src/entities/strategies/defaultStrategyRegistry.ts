import { HORDE_STEERING } from '../../content/ai/hordeSteering';
import type { AttackStrategyId, MovementStrategyId } from '../../content/units/units.types';
import type { AttackStrategy } from './AttackStrategy.types';
import { LaneFollowMovementStrategy } from './LaneFollowMovementStrategy';
import { LeashedChaseMovementStrategy } from './LeashedChaseMovementStrategy';
import { MeleeAttackStrategy } from './MeleeAttackStrategy';
import type { MovementStrategy } from './MovementStrategy.types';

/**
 * Every strategy by id, one record per behaviour (architecture 04 §4). A missing id does not
 * compile; targeting and pick-up strategies join as sibling keys.
 */
export type StrategyRegistry = {
  readonly movement: Readonly<Record<MovementStrategyId, MovementStrategy>>;
  readonly attack: Readonly<Record<AttackStrategyId, AttackStrategy>>;
};

/** The strategy registry: one line per strategy (architecture 02 §9). */
export const createDefaultStrategyRegistry = (): StrategyRegistry => ({
  movement: {
    'lane-follow': new LaneFollowMovementStrategy(HORDE_STEERING),
    'leashed-chase': new LeashedChaseMovementStrategy(HORDE_STEERING),
  },
  attack: {
    melee: new MeleeAttackStrategy(),
  },
});
