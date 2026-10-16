import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { DamageSource } from '../../state/GameEvents.types';
import type { GameState } from '../../state/GameState';
import type { Entity } from '../Entity';

/**
 * Whatever applies damage. `combat/DamagePipeline` satisfies it; the port exists because
 * `entities/` may not import `combat/` (02 §2).
 */
type DamageDealer = {
  apply(state: GameState, targetId: EntityId, amount: number, source: DamageSource): unknown;
};

/** What an attack may use: the state and the one damage pipeline. */
export type AttackContext = {
  readonly state: GameState;
  readonly damage: DamageDealer;
};

/**
 * How one kind of attack lands (architecture 04 §4, 05 §10): melee hits at once, a ranged attack
 * spawns a projectile that hits later. Stateless and shared. A new kind is one class, one
 * `AttackStrategyId` member and one line in `defaultStrategyRegistry.ts`.
 */
export interface AttackStrategy {
  /** Carries out one attack; `CombatSystem` has already checked reach and cooldown. */
  attack(attacker: Entity, targetId: EntityId, attack: UnitAttack, context: AttackContext): void;
}
