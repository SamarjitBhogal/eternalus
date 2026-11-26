import { HORDE_STEERING } from '../../content/ai/hordeSteering';
import type { StatusSteeringKind } from '../../content/status-effects/statusEffects.types';
import type { AttackStrategyId, MovementStrategyId } from '../../content/units/units.types';
import type { AttackStrategy } from './AttackStrategy.types';
import { CowerSteeringStrategy } from './CowerSteeringStrategy';
import { FleeSourceSteeringStrategy } from './FleeSourceSteeringStrategy';
import { LaneFollowMovementStrategy } from './LaneFollowMovementStrategy';
import { LeashedChaseMovementStrategy } from './LeashedChaseMovementStrategy';
import { MeleeAttackStrategy } from './MeleeAttackStrategy';
import { MeleeSweepAttackStrategy } from './MeleeSweepAttackStrategy';
import { RangedProjectileAttackStrategy } from './RangedProjectileAttackStrategy';
import type { MovementStrategy } from './MovementStrategy.types';
import type { StatusSteering } from './StatusSteering.types';

/**
 * Every strategy by id, one record per behaviour (architecture 04 §4). A missing id does not
 * compile; targeting and pick-up strategies join as sibling keys.
 */
export type StrategyRegistry = {
  readonly movement: Readonly<Record<MovementStrategyId, MovementStrategy>>;
  readonly attack: Readonly<Record<AttackStrategyId, AttackStrategy>>;
  /** How a status steers its holder (Fear, DEC-203), by the status's `steering` kind. */
  readonly steering: Readonly<Record<StatusSteeringKind, StatusSteering>>;
};

/** The strategy registry: one line per strategy (architecture 02 §9). */
export const createDefaultStrategyRegistry = (): StrategyRegistry => ({
  movement: {
    'lane-follow': new LaneFollowMovementStrategy(HORDE_STEERING),
    'leashed-chase': new LeashedChaseMovementStrategy(HORDE_STEERING),
  },
  attack: {
    melee: new MeleeAttackStrategy(),
    'melee-sweep': new MeleeSweepAttackStrategy(),
    'ranged-projectile': new RangedProjectileAttackStrategy(),
  },
  steering: {
    'flee-source': new FleeSourceSteeringStrategy(),
    cower: new CowerSteeringStrategy(),
  },
});
