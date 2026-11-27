import type { ProjectileSplash, RangedAttack } from '../content/units/units.types';
import { AreaHitQuery } from '../state/AreaHitQuery';
import type { HitArea } from '../state/AreaHitQuery.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { HitRunner } from '../state/HitRunner.types';
import { doesDiscReachPolygon } from '../utils/circlePolygon';
import { distance } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
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
 * An attack with `projectile.splash` (DEC-342) bursts where it lands instead. The blast is a disc
 * of the splash radius at the hit point, and its bodies come from the one hit rule for areas
 * (`AreaHitQuery`, DEC-322 (3)): live enemy units only (not on the shot's team, which is the
 * owner's, so never the owner; a neutral unit counts as an enemy) whose circle meets the disc, in
 * id order. A unit that takes no damage now is skipped, as for every area. The damage is scaled by
 * `1 - (1 - edgeMultiplier) x min(1, d / radius)`, `d` the distance from the hit point to the
 * unit's centre, on top of the fall-off. The on-hit steps run on each unit. Structures, map objects
 * and allies take nothing; the struck body's id is not read, so a shot that lands on a structure
 * still bursts on the units around that point.
 */
export class WeaponImpact implements ProjectileImpact<'weapon'> {
  /**
   * @param damage - The match's one damage pipeline.
   * @param hits - Runs the shot's attack's `onHit` steps, then the owner's statuses', after the
   *   damage; `null` runs none.
   * @param areas - The match's one hit rule for areas (`Simulation`'s, DEC-344 (3)): `find`, for a
   *   blast.
   */
  public constructor(
    private readonly damage: Pick<DamagePipeline, 'apply'>,
    private readonly hits: HitRunner | null,
    private readonly areas: Pick<AreaHitQuery, 'find'>,
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

  /**
   * Strikes each enemy unit in the blast. The shot may outlive its owner, so the attacker is the
   * shot's team and origin, not the store's.
   */
  private burst(
    state: GameState,
    hit: ProjectileHit<'weapon'>,
    attack: RangedAttack,
    splash: ProjectileSplash,
    share: number,
  ): readonly EntityId[] {
    const struck = this.areas.find(
      state.entities,
      hit.ownerId,
      WeaponImpact.blastAt(hit.point, splash.radius),
      { targetId: null, point: null },
      { team: 'enemies', families: AreaHitQuery.UNIT_FAMILIES },
      { team: hit.team, position: hit.origin },
    );
    // Every distance before the first strike: an on-hit step may move a unit.
    const blasted = struck.map((id) => {
      const d = distance(hit.point, state.entities.placeOf(id)?.position ?? hit.point);
      return { id, edge: 1 - (1 - splash.edgeMultiplier) * Math.min(1, d / splash.radius) };
    });
    for (const { id, edge } of blasted) {
      this.strike(state, hit, attack, id, share * edge);
    }
    return struck;
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

  /** The blast as a `HitArea`: a disc of `radius` at `point`, which a body's circle or outline meets. */
  private static blastAt(point: Vec2, radius: number): HitArea {
    return {
      overlapsBody: ({ position, radius: bodyRadius }) =>
        distance(point, position) <= radius + bodyRadius,
      overlapsOutline: (polygon) => doesDiscReachPolygon(point, radius, polygon),
    };
  }
}
