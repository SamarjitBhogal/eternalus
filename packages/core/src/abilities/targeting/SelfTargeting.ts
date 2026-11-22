import type { Aim } from '../../components/AbilitySlotRuntime.types';
import type { AbilityRejectReason } from '../../content/abilities/AbilityDefinition.types';
import type { CastTargeting, TargetingSpec } from './CastTargeting.types';

/**
 * `self` (05 §2): the cast acts around the caster, so any aim will do and the cast runs with the
 * aim as sent (its steps are placed on the caster, not on the aim).
 */
export class SelfTargeting implements CastTargeting {
  public readonly kind = 'self';

  /** True: a self cast is still aimed first, its range overlay shown (DEC-209 (3)). */
  public readonly usesAim = true;

  /** Any aim will do. */
  public aimBlockedBy(): AbilityRejectReason | null {
    return null;
  }

  /** The aim as sent. */
  public aimFor(_spec: TargetingSpec, aim: Aim): Aim {
    return aim;
  }
}
