import type { UnitAttack } from '../../content/units/units.types';
import type { Entity } from '../Entity';
import type { AttackAim, AttackContext, AttackStrategy } from './AttackStrategy.types';
import { weaponSourceOf } from './weaponSourceOf';

/** Hits the target in the same tick, through the damage pipeline, then runs the hit's effects. */
export class MeleeAttackStrategy implements AttackStrategy {
  /**
   * Deals `attack.damage` to the target. The source is the attacker and its weapon
   * (`weaponSourceOf`). The hit lands in this tick, so its `onHit` effects run here too (05 §10),
   * after the damage, and it is recorded as the attack's hit (`GameState.recordHits`). An aim with
   * no target is a whiff: it hits nothing (a one-target attack has no area, DEC-184 is about
   * weapons).
   */
  public attack(
    attacker: Entity,
    { targetId }: AttackAim,
    attack: UnitAttack,
    { state, damage, hits }: AttackContext,
  ): void {
    if (targetId === null) {
      return;
    }
    damage.apply(state, targetId, attack.damage, weaponSourceOf(attacker));
    hits?.afterHit(state, attacker.id, targetId, attack);
    state.recordHits(attacker.id, [targetId]);
  }
}
