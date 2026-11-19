import type { Aim } from '../../components/AbilitySlotRuntime.types';
import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import type { AbilityRejectReason } from '../../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { CastTargeting, TargetingSpec } from './CastTargeting.types';

/**
 * `heading` (05 §2; Fury's dash, DEC-270): the cast ignores the aim and goes the way the caster
 * moves, or the way it faces when it does not move. Any aim will do.
 */
export class HeadingTargeting implements CastTargeting {
  public readonly kind = 'heading';

  /** Any aim will do: it is ignored. */
  public aimBlockedBy(): AbilityRejectReason | null {
    return null;
  }

  /**
   * One metre from the caster the way it moves, or the way it faces when it does not move
   * (`Transform.facing` is always a unit vector).
   *
   * @throws Error when `casterId` names no entity.
   */
  public aimFor(_spec: TargetingSpec, _aim: Aim, casterId: EntityId, state: GameState): Aim {
    const caster = state.entities.get(casterId);
    if (caster === undefined) {
      throw new Error(`HeadingTargeting: no entity "${casterId}" to aim the cast of.`);
    }
    const transform = caster.getComponent(Transform);
    const heading = caster.findComponent(Movement)?.heading;
    const way =
      heading !== undefined && (heading.x !== 0 || heading.y !== 0) ? heading : transform.facing;
    const { position } = transform;
    return { point: { x: position.x + way.x, y: position.y + way.y }, targetId: null };
  }
}
