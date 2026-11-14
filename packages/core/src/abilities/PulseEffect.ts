import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { Movement } from '../components/Movement';
import { distance } from '../utils/geometry';
import { sweepDisplacement } from './sweepDisplacement';
import type { AbilityEffect } from './AbilityEffect';
import type { AbilityEffectContext } from './AbilityEffect.types';
import type { AbilityEffectSpec } from '../content/abilities/abilities.types';

/** Radial magical damage, concussion and collision-safe knockback. */
export class PulseEffect implements AbilityEffect<'pulse'> {
  /** Visits living enemies in deterministic store order. */
  public apply(
    spec: Extract<AbilityEffectSpec, { kind: 'pulse' }>,
    context: AbilityEffectContext,
  ): void {
    const { state, caster, damage, statuses, abilityId } = context;
    const origin = caster.getComponent(Transform).position;
    state.entities.forEach((target) => {
      const at = target.findComponent(Transform);
      if (
        at === undefined ||
        target.id === caster.id ||
        target.findComponent(Health)?.isDead !== false ||
        state.entities.teamOf(target.id) === state.entities.teamOf(caster.id)
      )
        return;
      const length = distance(origin, at.position);
      if (length > spec.radius + at.radius) return;
      damage.apply(state, target.id, spec.damage, {
        attackerId: caster.id,
        kind: 'ability',
        definitionId: abilityId,
      });
      statuses.apply(state, target.id, spec.statusId, caster.id);
      if (target.hasComponent(Movement) && length > 0)
        sweepDisplacement(state, target, {
          x: ((at.position.x - origin.x) * spec.knockback) / length,
          y: ((at.position.y - origin.y) * spec.knockback) / length,
        });
    });
  }
}
