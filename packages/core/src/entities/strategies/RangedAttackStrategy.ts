import { Combat } from '../../components/Combat';
import { Transform } from '../../components/Transform';
import type { UnitAttack } from '../../content/units/units.types';
import type { Entity } from '../Entity';
import type { AttackContext, AttackStrategy } from './AttackStrategy.types';

/** Requests a travelling projectile; its system owns creation and impact damage. */
export class RangedAttackStrategy implements AttackStrategy {
  /** Copies launch positions so later movement cannot redirect a bolt. */
  public attack(
    attacker: Entity,
    targetId: string,
    attack: UnitAttack,
    { state }: AttackContext,
  ): void {
    const origin = attacker.findComponent(Transform)?.position;
    const destination = state.entities.get(targetId)?.findComponent(Transform)?.position;
    if (origin === undefined || destination === undefined) return;
    state.events.emit('projectile-requested', {
      attackerId: attacker.id,
      targetId,
      origin: { ...origin },
      destination: { ...destination },
      damage: attack.damage,
      weaponId: attacker.findComponent(Combat)?.weaponId ?? attacker.definitionId,
    });
  }
}
