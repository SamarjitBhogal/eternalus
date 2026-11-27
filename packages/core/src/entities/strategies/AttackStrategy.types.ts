import type { UnitAttack } from '../../content/units/units.types';
import type { AreaHitQuery } from '../../state/AreaHitQuery';
import type { EntityId } from '../../state/EntityStore.types';
import type { DamageSource } from '../../state/GameEvents.types';
import type { Vec2 } from '../../utils/geometry.types';
import type { GameState } from '../../state/GameState';
import type { HitRunner } from '../../state/HitRunner.types';
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
 * What an attack may use: the state, the one damage pipeline, what runs a landed hit's effects
 * (`null`: none run), the match's one factory, which builds the projectiles ranged attacks fire,
 * and the one hit rule for areas (`AreaHitQuery`, DEC-322 (3)), which a sweep and a shot apply.
 */
export type AttackContext = {
  readonly state: GameState;
  readonly damage: DamageDealer;
  readonly hits: HitRunner | null;
  readonly factory: EntityFactory;
  /** A sweep finds what it hits (`find`); a shot finds the body it aims at (`aimedBodyOf`). */
  readonly areas: Pick<AreaHitQuery, 'find' | 'aimedBodyOf'>;
};

/**
 * Where one attack goes (DEC-184): the locked target or the aim point, and the unit vector the
 * attack is aimed along. A one-target melee attack needs `targetId`; a sweep and a shot use
 * `direction`. A sweep and a shot hit a walk-on outline only when they aim at it (DEC-322 (1)):
 * it is `targetId`, or `point` is on it (`AreaHitQuery`).
 */
export type AttackAim = {
  /** The entity the attack is locked on, or `null` for an aimed attack with no target. */
  readonly targetId: EntityId | null;
  /** The world point an aimed attack goes to, or `null` for a locked attack. */
  readonly point: Vec2 | null;
  /** Unit vector from the attacker towards the target or the aim point. */
  readonly direction: Vec2;
};

/**
 * How one kind of attack lands (architecture 04 §4, 05 §10): melee hits one target at once, a
 * sweep hits everything in front of the attacker in the same tick, a ranged attack spawns a
 * projectile that hits later. Stateless and shared. A new kind is one class, one
 * `AttackStrategyId` member and one line in `defaultStrategyRegistry.ts`.
 */
export interface AttackStrategy {
  /**
   * Carries out one attack along `aim`; `CombatSystem` has already checked cooldown, and reach
   * for a locked target.
   */
  attack(attacker: Entity, aim: AttackAim, attack: UnitAttack, context: AttackContext): void;
}
