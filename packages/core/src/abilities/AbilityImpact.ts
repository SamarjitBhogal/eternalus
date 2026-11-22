import type { ProjectileHit, ProjectileImpact } from '../combat/ProjectileImpact.types';
import { Progression } from '../components/Progression';
import { Transform } from '../components/Transform';
import type { GameState } from '../state/GameState';
import type { AbilityRegistry } from './AbilityRegistry';
import type { HitEffects } from './HitEffects';

/**
 * An ability's shot landing (architecture 05 §3, §10; Hamstring): the step's `onHit` steps run as
 * one cast on the struck body (`HitEffects.runSteps`), placed from where the shot touched it to
 * its position, which the `hit` shape reads (a unit's centre, a map object's position). They are
 * credited to the shot's owner under the ability, grown by the ability's `scaling` at the owner's
 * level when the shot lands (level 1 for an owner with none, or one gone from the match).
 */
export class AbilityImpact implements ProjectileImpact<'ability'> {
  /**
   * @param hits - Runs the steps as one cast.
   * @param abilities - Where the ability's scaling is found (the `AbilityRegistry`).
   */
  public constructor(
    private readonly hits: Pick<HitEffects, 'runSteps'>,
    private readonly abilities: Pick<AbilityRegistry, 'resolve'>,
  ) {}

  /** Runs the shot's `onHit` steps on the body; nothing when the body has no position. */
  public land(state: GameState, hit: ProjectileHit<'ability'>): void {
    const body = state.entities.get(hit.bodyId)?.findComponent(Transform)?.position;
    if (body === undefined) {
      return;
    }
    const { abilityId, slot, onHit } = hit.impact;
    this.hits.runSteps(
      state,
      {
        casterId: hit.ownerId,
        sourceId: abilityId,
        slot,
        steps: onHit,
        scaling: this.abilities.resolve(abilityId).definition.scaling,
        casterLevel: state.entities.get(hit.ownerId)?.findComponent(Progression)?.level ?? 1,
      },
      { from: { x: hit.point.x, y: hit.point.y }, to: { x: body.x, y: body.y } },
      hit.bodyId,
    );
  }
}
