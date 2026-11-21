import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { DamageSource } from '../../state/GameEvents.types';
import type { GameState } from '../../state/GameState';
import type { Entity } from '../Entity';
import type { EntityFactory } from '../EntityFactory';

/**
 * Whatever applies damage. `combat/DamagePipeline` satisfies it; the port exists because
 * `entities/` may not import `combat/` (02 §2).
 */
type DamageDealer = {
  apply(state: GameState, targetId: EntityId, amount: number, source: DamageSource): unknown;
};

/**
 * Whatever runs the effects of a landed hit (a status's `onHit`, 05 §8 and §10).
 * `abilities/HitEffects` satisfies it; the port exists because `entities/` may not import
 * `abilities/`.
 */
type HitRunner = {
  afterHit(state: GameState, attackerId: EntityId, targetId: EntityId): void;
};

/**
 * What an attack may use: the state, the one damage pipeline, what runs a landed hit's effects
 * (`null`: none run) and the factory that builds projectiles (`null`: this attack cannot fire).
 */
export type AttackContext = {
  readonly state: GameState;
  readonly damage: DamageDealer;
  readonly hits: HitRunner | null;
  readonly factory: EntityFactory | null;
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
