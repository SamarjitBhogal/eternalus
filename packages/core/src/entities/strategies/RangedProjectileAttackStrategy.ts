import { Movement } from '../../components/Movement';
import { ProjectilePayload } from '../../components/ProjectilePayload';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import type { UnitAttack } from '../../content/units/units.types';
import type { EntityId } from '../../state/EntityStore.types';
import { normalizeInto } from '../../utils/vec2';
import type { MutableVec2 } from '../../utils/vec2.types';
import type { Entity } from '../Entity';
import type { AttackContext, AttackStrategy } from './AttackStrategy.types';
import { weaponSourceOf } from './weaponSourceOf';

/**
 * Fires a projectile at the target (architecture 05 §10): it spawns at the attacker's centre, so
 * its circle starts clear of every wall the attacker is kept out of, flies straight along the line
 * to the target's facing point (no lead) and carries a `ProjectilePayload` with a weapon impact.
 * An attacker that stands on that point (on a unit target's centre) fires along its facing, so a
 * shot always moves. It passes its owner by; `ProjectileSystem` flies and lands it, from the next
 * tick.
 */
export class RangedProjectileAttackStrategy implements AttackStrategy {
  /** Scratch for the point aimed at, then the aim direction. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /**
   * Spawns the shot. The source is the attacker and its weapon, as for melee (`weaponSourceOf`);
   * fall-off is measured from the attacker's centre.
   *
   * @throws Error when handed an attack that is not ranged (a miswired registry), when the
   *   attacker has no `Transform` or `TeamMembership`, or when the target has no point to aim at:
   *   `CombatSystem` fires only at a target in reach, which has one.
   */
  public attack(
    attacker: Entity,
    targetId: EntityId,
    attack: UnitAttack,
    { state, factory }: AttackContext,
  ): void {
    if (attack.strategy !== 'ranged-projectile') {
      throw new Error(`The ranged attack strategy cannot fire a "${attack.strategy}" attack.`);
    }
    const { team } = attacker.getComponent(TeamMembership);
    const transform = attacker.getComponent(Transform);
    const origin = transform.position;
    if (!state.entities.facingPointOf(attacker.id, targetId, this.aim)) {
      throw new Error(`"${attacker.id}" has no point to aim at on "${targetId}".`);
    }
    if (this.aim.x === origin.x && this.aim.y === origin.y) {
      this.aim.x = transform.facing.x;
      this.aim.y = transform.facing.y;
    } else {
      normalizeInto(this.aim, { x: this.aim.x - origin.x, y: this.aim.y - origin.y });
    }

    const projectile = factory.create('projectile', attack.projectile.projectileId, {
      team,
      position: origin,
    });
    projectile.addComponent(
      new ProjectilePayload({
        ownerId: attacker.id,
        team,
        source: weaponSourceOf(attacker),
        targetId,
        impact: { kind: 'weapon', attack },
        origin,
      }),
    );
    projectile.getComponent(Movement).steer(this.aim);
    state.entities.add(projectile);
    state.events.emit('entity-spawned', { entityId: projectile.id, kind: projectile.kind, team });
  }
}
