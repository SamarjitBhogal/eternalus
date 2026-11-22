import type { GameState } from '../state/GameState';
import type { HitRunner } from '../state/HitRunner.types';
import { distance } from '../utils/geometry';
import type { DamagePipeline } from './DamagePipeline';
import { falloffMultiplier } from './falloffMultiplier';
import type { ProjectileHit, ProjectileImpact } from './ProjectileImpact.types';

/**
 * A weapon's shot landing (architecture 05 §10): the attack's damage, scaled by its fall-off over
 * the distance from the shot's origin to where it touched the body, through the match's damage
 * pipeline; then the owner's on-hit effects run, as for a melee hit.
 */
export class WeaponImpact implements ProjectileImpact<'weapon'> {
  /**
   * @param damage - The match's one damage pipeline.
   * @param hits - Runs the owner's statuses' `onHit` steps after the damage; `null` runs none.
   */
  public constructor(
    private readonly damage: Pick<DamagePipeline, 'apply'>,
    private readonly hits: HitRunner | null,
  ) {}

  /** Deals the fallen-off damage to the body, then runs the owner's on-hit effects. */
  public land(state: GameState, hit: ProjectileHit<'weapon'>): void {
    const { attack } = hit.impact;
    const share = falloffMultiplier(attack.projectile.falloff, distance(hit.origin, hit.point));
    this.damage.apply(state, hit.bodyId, attack.damage * share, hit.source);
    this.hits?.afterHit(state, hit.ownerId, hit.bodyId, attack);
  }
}
