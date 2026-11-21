import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { Entity } from '../Entity';
import type { AttackContext, AttackStrategy } from './AttackStrategy.types';
import { weaponSourceOf } from './weaponSourceOf';

/** Hits the target in the same tick, through the damage pipeline, then runs the hit's effects. */
export class MeleeAttackStrategy implements AttackStrategy {
  /**
   * Deals `attack.damage` to the target. The source is the attacker and its weapon
   * (`weaponSourceOf`). The hit lands in this tick, so its `onHit` effects run here too (05 §10),
   * after the damage.
   */
  public attack(
    attacker: Entity,
    targetId: EntityId,
    attack: UnitAttack,
    { state, damage, hits }: AttackContext,
  ): void {
    damage.apply(state, targetId, attack.damage, weaponSourceOf(attacker));
    hits?.afterHit(state, attacker.id, targetId);
  }
}
