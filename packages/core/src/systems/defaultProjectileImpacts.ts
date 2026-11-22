import type { AbilityRegistry } from '../abilities/AbilityRegistry';
import { AbilityImpact } from '../abilities/AbilityImpact';
import type { HitEffects } from '../abilities/HitEffects';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { ProjectileImpacts } from '../combat/ProjectileImpact.types';
import { WeaponImpact } from '../combat/WeaponImpact';
import type { HitRunner } from '../state/HitRunner.types';

/**
 * What a landed shot does, one `ProjectileImpact` per payload impact kind (architecture 02 §9),
 * for `ProjectileSystem`. A new kind adds its line here and its data to
 * `ProjectileImpactDataByKind`; the mapped type makes a missing line a compile error.
 *
 * @param damage - The match's one damage pipeline.
 * @param hits - Runs the owner's statuses' `onHit` steps after a weapon hit; `null` runs none.
 * @param abilityShots - Runs an ability shot's `onHit` steps (`HitEffects`) and finds the
 *   ability's scaling (the `AbilityRegistry`).
 */
export function createDefaultProjectileImpacts(
  damage: DamagePipeline,
  hits: HitRunner | null,
  abilityShots: {
    readonly hits: Pick<HitEffects, 'runSteps'>;
    readonly abilities: Pick<AbilityRegistry, 'resolve'>;
  },
): ProjectileImpacts {
  return {
    weapon: new WeaponImpact(damage, hits),
    ability: new AbilityImpact(abilityShots.hits, abilityShots.abilities),
  };
}
