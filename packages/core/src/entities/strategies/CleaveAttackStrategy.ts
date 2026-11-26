import { Health } from '../../components/Health';
import { Transform } from '../../components/Transform';
import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { Entity } from '../Entity';
import { Unit } from '../Unit';
import type { AttackContext, AttackStrategy } from './AttackStrategy.types';
import { MeleeAttackStrategy } from './MeleeAttackStrategy';

/** The Monarch's swing hits its target and other hostile units in reach in front of it. */
export class CleaveAttackStrategy implements AttackStrategy {
  private readonly melee = new MeleeAttackStrategy();

  /** Applies one melee hit per eligible unit, with the primary target first. */
  public attack(
    attacker: Entity,
    targetId: EntityId,
    attack: UnitAttack,
    context: AttackContext,
  ): void {
    const { entities } = context.state;
    const origin = attacker.getComponent(Transform).position;
    const target = entities.get(targetId);
    const aim = target?.findComponent(Transform)?.position;
    if (aim === undefined) return;

    const dx = aim.x - origin.x;
    const dy = aim.y - origin.y;
    const team = entities.teamOf(attacker.id);
    this.melee.attack(attacker, targetId, attack, context);
    entities.forEach((candidate) => {
      if (
        !(candidate instanceof Unit) ||
        candidate.id === targetId ||
        entities.teamOf(candidate.id) === team ||
        candidate.getComponent(Health).isDead ||
        !entities.isInReach(attacker.id, candidate.id)
      )
        return;
      const position = candidate.getComponent(Transform).position;
      if ((position.x - origin.x) * dx + (position.y - origin.y) * dy > 0) {
        this.melee.attack(attacker, candidate.id, attack, context);
      }
    });
  }
}
