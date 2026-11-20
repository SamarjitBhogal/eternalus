import { Combat } from '../../components/Combat';
import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { Entity } from '../Entity';
import type { AttackContext, AttackStrategy } from './AttackStrategy.types';

/** Hits the target in the same tick, through the damage pipeline, then runs the hit's effects. */
export class MeleeAttackStrategy implements AttackStrategy {
  /**
   * Deals `attack.damage` to the target. The source is the attacker and its weapon (05 §9–10); a unit
   * fighting with its own attack (mobs, 04 §5) names its own definition. The hit lands in this
   * tick, so its `onHit` effects run here too (05 §10), after the damage.
   */
  public attack(
    attacker: Entity,
    targetId: EntityId,
    attack: UnitAttack,
    { state, damage, hits }: AttackContext,
  ): void {
    damage.apply(state, targetId, attack.damage, {
      attackerId: attacker.id,
      kind: 'weapon',
      definitionId: attacker.findComponent(Combat)?.weaponId ?? attacker.definitionId,
    });
    hits?.afterHit(state, attacker.id, targetId);
  }
}
