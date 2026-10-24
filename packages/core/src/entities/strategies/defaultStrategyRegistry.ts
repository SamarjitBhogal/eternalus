import type { AttackStrategyId } from '../../content/units/units.types';
import type { AttackStrategy } from './AttackStrategy.types';
import { MeleeAttackStrategy } from './MeleeAttackStrategy';

/**
 * Every strategy by id, one record per behaviour (04 §4). A missing id does not compile; movement,
 * targeting and pick-up strategies join as sibling keys.
 */
export type StrategyRegistry = {
  readonly attack: Readonly<Record<AttackStrategyId, AttackStrategy>>;
};

/** The strategy registry: one line per strategy (architecture 02 §9). */
export const createDefaultStrategyRegistry = (): StrategyRegistry => ({
  attack: {
    melee: new MeleeAttackStrategy(),
  },
});
