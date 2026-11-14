import type { DebuffSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';

/**
 * Applies a negative status to every enemy in the step's shape through the match's one
 * `StatusEffectApplier` (architecture 05 §3, §8), credited to the caster. A step's
 * `durationTicks` overrides the status's own duration for this application (Blade Runner's 0.5 s
 * stun against the 2 s default); without it the status lasts its own time.
 */
export class DebuffEffect implements AbilityEffect<DebuffSpec> {
  public readonly kind = 'debuff';

  /** Applies the step's status to every enemy in its shape, in id order. */
  public apply(spec: DebuffSpec, cast: CastContext): void {
    for (const targetId of cast.targets(spec.shape, { team: 'enemies' })) {
      cast.statuses.apply(cast.state, targetId, spec.statusId, cast.casterId, spec.durationTicks);
    }
  }
}
