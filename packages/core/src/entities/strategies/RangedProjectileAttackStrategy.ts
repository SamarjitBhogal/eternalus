import { Movement } from '../../components/Movement';
import { Progression } from '../../components/Progression';
import { ProjectilePayload } from '../../components/ProjectilePayload';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import type { UnitAttack } from '../../content/units/units.types';
import type { Entity } from '../Entity';
import type { AttackAim, AttackContext, AttackStrategy } from './AttackStrategy.types';
import { weaponSourceOf } from './weaponSourceOf';

/**
 * Fires a projectile along the aim (architecture 05 §10, DEC-184): it spawns at the attacker's
 * centre, so its circle starts clear of every wall the attacker is kept out of, flies straight
 * along `aim.direction` (no lead) and carries a `ProjectilePayload` with a weapon impact and the
 * body it aims at: the locked target, or else the outline shots fly over that the aim point is on
 * (a walk-on outline, a camp fire: `AreaHitQuery.aimedBodyOf`, DEC-322 (1)), so the shot can hit
 * that outline and flies over the others. `CombatSystem` hands it a unit direction, so a shot always moves. It passes its owner
 * by; `ProjectileSystem` flies and lands it, from the next tick.
 */
export class RangedProjectileAttackStrategy implements AttackStrategy {
  /**
   * Spawns the shot. The source is the attacker and its weapon, as for melee (`weaponSourceOf`);
   * fall-off is measured from the attacker's centre.
   *
   * @throws Error when handed an attack that is not ranged (a miswired registry), or when the
   *   attacker has no `Transform` or `TeamMembership`.
   */
  public attack(
    attacker: Entity,
    { targetId, point, direction }: AttackAim,
    attack: UnitAttack,
    { state, factory, areas }: AttackContext,
  ): void {
    if (attack.strategy !== 'ranged-projectile') {
      throw new Error(`The ranged attack strategy cannot fire a "${attack.strategy}" attack.`);
    }
    const { team } = attacker.getComponent(TeamMembership);
    const origin = attacker.getComponent(Transform).position;
    const projectile = factory.create('projectile', attack.projectile.projectileId, {
      team,
      position: origin,
    });
    projectile.addComponent(
      new ProjectilePayload({
        ownerId: attacker.id,
        team,
        ownerLevel: attacker.findComponent(Progression)?.level ?? 1,
        source: weaponSourceOf(attacker),
        targetId:
          targetId ??
          (point === null ? null : areas.aimedBodyOf(state.entities, attacker.id, point)),
        impact: { kind: 'weapon', attack },
        origin,
      }),
    );
    projectile.getComponent(Movement).steer(direction);
    state.entities.add(projectile);
    state.events.emit('entity-spawned', { entityId: projectile.id, kind: projectile.kind, team });
  }
}
