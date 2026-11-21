import { Combat } from '../../components/Combat';
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

/**
 * Fires a projectile at the target (architecture 05 §10): it spawns at the attacker's edge, flies
 * straight along the line to the target's facing point (no lead) and carries a `ProjectilePayload`.
 * Landing is the combat system's job, in a later tick.
 */
export class RangedProjectileAttackStrategy implements AttackStrategy {
  /** Scratch for the point aimed at, then the aim direction. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /**
   * Spawns the shot. Does nothing for a melee attack, when the context has no factory, or when the
   * attacker or target has no position. The source is the attacker and its weapon, as for melee.
   */
  public attack(
    attacker: Entity,
    targetId: EntityId,
    attack: UnitAttack,
    { state, factory }: AttackContext,
  ): void {
    if (attack.strategy !== 'ranged-projectile' || factory === null) {
      return;
    }
    const team = attacker.findComponent(TeamMembership)?.team;
    const body = attacker.findComponent(Transform);
    if (
      team === undefined ||
      body === undefined ||
      !state.entities.facingPointOf(attacker.id, targetId, this.aim)
    ) {
      return;
    }
    const { x, y } = body.position;
    normalizeInto(this.aim, { x: this.aim.x - x, y: this.aim.y - y });
    const origin = { x: x + this.aim.x * body.radius, y: y + this.aim.y * body.radius };

    const projectile = factory.create('projectile', attack.projectile.projectileId, {
      team,
      position: origin,
    });
    projectile.addComponent(
      new ProjectilePayload({
        ownerId: attacker.id,
        team,
        source: {
          attackerId: attacker.id,
          kind: 'weapon',
          definitionId: attacker.findComponent(Combat)?.weaponId ?? attacker.definitionId,
        },
        attack,
        origin,
      }),
    );
    projectile.getComponent(Movement).steer(this.aim);
    state.entities.add(projectile);
    state.events.emit('entity-spawned', { entityId: projectile.id, kind: projectile.kind, team });
  }
}
