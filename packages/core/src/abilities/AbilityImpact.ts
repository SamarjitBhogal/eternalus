import type { ProjectileHit, ProjectileImpact } from '../combat/ProjectileImpact.types';
import { Transform } from '../components/Transform';
import type { GameState } from '../state/GameState';
import type { HitEffects } from './HitEffects';

/**
 * An ability's shot landing (architecture 05 §3, §10; Hamstring): the step's `onHit` steps run as
 * one cast on the struck body (`HitEffects.runSteps`), placed from where the shot touched it to
 * its position. They are credited to the shot's owner under the ability and grow by the scaling
 * and the caster's level the shot carries from its cast, so the owner may be dead or gone.
 */
export class AbilityImpact implements ProjectileImpact<'ability'> {
  /** @param hits - Runs the steps as one cast. */
  public constructor(private readonly hits: Pick<HitEffects, 'runSteps'>) {}

  /** Runs the shot's `onHit` steps on the body; nothing when the body has no position. */
  public land(state: GameState, hit: ProjectileHit<'ability'>): void {
    const body = state.entities.get(hit.bodyId)?.findComponent(Transform)?.position;
    if (body === undefined) {
      return;
    }
    const { abilityId, slot, onHit, scaling, casterLevel } = hit.impact;
    this.hits.runSteps(
      state,
      { casterId: hit.ownerId, sourceId: abilityId, slot, steps: onHit, scaling, casterLevel },
      // A copy, as `afterHit` makes: the placement does not alias the live `Transform` position.
      { from: hit.point, to: { x: body.x, y: body.y } },
      hit.bodyId,
    );
  }
}
