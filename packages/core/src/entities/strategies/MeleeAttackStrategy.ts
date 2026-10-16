import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { Entity } from '../Entity';
import type { AttackContext, AttackStrategy } from './AttackStrategy.types';

/** Hits the target in the same tick, through the damage pipeline. */
export class MeleeAttackStrategy implements AttackStrategy {
  /** Deals `attack.damage` to the target, naming the attacker as the source. */
  public attack(
    attacker: Entity,
    targetId: EntityId,
    attack: UnitAttack,
    { state, damage }: AttackContext,
  ): void {
    // ponytail: names the attacker's definition; the weapon id once weapons (05 §10) land.
    damage.apply(state, targetId, attack.damage, {
      attackerId: attacker.id,
      kind: 'weapon',
      definitionId: attacker.definitionId,
    });
  }
}
