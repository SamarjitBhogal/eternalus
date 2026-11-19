import type { Aim } from '../../components/AbilitySlotRuntime.types';
import { Transform } from '../../components/Transform';
import type { AbilityRejectReason } from '../../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { CastTargeting, TargetingSpec } from './CastTargeting.types';

/**
 * `directional` (05 §2): the cast follows the aim vector, with no range (dashes). The aim must give
 * a direction: a point a finite, non-zero distance from the caster.
 */
export class DirectionalTargeting implements CastTargeting {
  public readonly kind = 'directional';

  /** `no-target` unless the aim point lies a finite, non-zero distance from the caster. */
  public aimBlockedBy(
    _spec: TargetingSpec,
    { point }: Aim,
    casterId: EntityId,
    state: GameState,
  ): AbilityRejectReason | null {
    const transform = state.entities.get(casterId)?.findComponent(Transform);
    if (transform === undefined) {
      return 'no-target';
    }
    const dx = point.x - transform.position.x;
    const dy = point.y - transform.position.y;
    return Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0)
      ? null
      : 'no-target';
  }

  /** The aim as sent. */
  public aimFor(_spec: TargetingSpec, aim: Aim): Aim {
    return aim;
  }
}
