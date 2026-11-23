import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { ProjectileSplash, RangedAttack } from '../content/units/units.types';
import { isUnitFamily } from '../entities/unitFamilies';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { HitRunner } from '../state/HitRunner.types';
import { compareById } from '../utils/compareById';
import { distance } from '../utils/geometry';
import type { DamagePipeline } from './DamagePipeline';
import { falloffMultiplier } from './falloffMultiplier';
import type { ProjectileHit, ProjectileImpact } from './ProjectileImpact.types';

/**
 * A weapon's shot landing (architecture 05 §10): the attack's damage, scaled by its fall-off over
 * the distance from the shot's origin to where it touched the body, through the match's damage
 * pipeline; then the on-hit steps run, as for a melee hit: the `onHit` of the attack the shot was
 * fired with (a heavy turret bolt's concussion), then the owner's statuses' `onHit`. The hit is
 * also the shooter (`Shooter`): the attack's `onHit` runs from the owner as it fired when the
 * owner is gone before the shot lands.
 *
 * An attack with `projectile.splash` (DEC-342) bursts where it lands instead: every live enemy
 * unit (a unit family, not on the shot's team, which is the owner's, so never the owner; a
 * neutral unit counts as an enemy) whose circle meets the blast circle at the hit point takes the damage, in id order. It is
 * scaled by `1 - (1 - edgeMultiplier) x min(1, d / radius)`, `d` the distance from the hit point to
 * the unit's centre, on top of the fall-off. The on-hit steps run on each unit. Structures and
 * allies take nothing; the struck body's id is not read, so a straight shot that touches a
 * structure still bursts on the units around that point.
 */
export class WeaponImpact implements ProjectileImpact<'weapon'> {
  /**
   * @param damage - The match's one damage pipeline.
   * @param hits - Runs the shot's attack's `onHit` steps, then the owner's statuses', after the
   *   damage; `null` runs none.
   */
  public constructor(
    private readonly damage: Pick<DamagePipeline, 'apply'>,
    private readonly hits: HitRunner | null,
  ) {}

  /**
   * Deals the fallen-off damage to the body (or, with a blast, to each unit in it), then runs the
   * on-hit steps of the shot's attack on each. A hit on no body with no blast does nothing.
   */
  public land(state: GameState, hit: ProjectileHit<'weapon'>): readonly EntityId[] {
    const { attack } = hit.impact;
    const { splash } = attack.projectile;
    const share = falloffMultiplier(attack.projectile.falloff, distance(hit.origin, hit.point));
    if (splash !== undefined) {
      return this.burst(state, hit, attack, splash, share);
    }
    if (hit.bodyId === null) return [];
    this.strike(state, hit, attack, hit.bodyId, share);
    return [hit.bodyId];
  }

  private burst(
    state: GameState,
    hit: ProjectileHit<'weapon'>,
    attack: RangedAttack,
    splash: ProjectileSplash,
    share: number,
  ): readonly EntityId[] {
    const struck: { id: EntityId; d: number }[] = [];
    state.entities.forEach((entity) => {
      const transform = entity.findComponent(Transform);
      const health = entity.findComponent(Health);
      if (
        transform === undefined ||
        health === undefined ||
        health.isDead ||
        !isUnitFamily(entity.family) ||
        entity.findComponent(TeamMembership)?.team === hit.team
      ) {
        return;
      }
      const d = distance(hit.point, transform.position);
      if (d <= splash.radius + transform.radius) struck.push({ id: entity.id, d });
    });
    struck.sort((a, b) => compareById(a.id, b.id));
    for (const { id, d } of struck) {
      const edge = 1 - (1 - splash.edgeMultiplier) * Math.min(1, d / splash.radius);
      this.strike(state, hit, attack, id, share * edge);
    }
    return struck.map(({ id }) => id);
  }

  private strike(
    state: GameState,
    hit: ProjectileHit<'weapon'>,
    attack: RangedAttack,
    bodyId: EntityId,
    share: number,
  ): void {
    this.damage.apply(state, bodyId, attack.damage * share, hit.source);
    this.hits?.afterHit(state, hit.ownerId, bodyId, attack, hit);
  }
}
