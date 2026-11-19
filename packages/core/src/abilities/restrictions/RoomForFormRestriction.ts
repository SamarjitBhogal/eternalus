import { Transform } from '../../components/Transform';
import type {
  AbilityRejectReason,
  AbilityRestrictionSpec,
} from '../../content/abilities/AbilityDefinition.types';
import type { GameState } from '../../state/GameState';
import type { AbilityRestriction } from '../AbilityRestriction.types';

/** Refuses form growth before payment when the larger body cannot fit its current position. */
export class RoomForFormRestriction implements AbilityRestriction<
  Extract<AbilityRestrictionSpec, { kind: 'room-for-form' }>
> {
  public readonly kind = 'room-for-form';
  /** Uses the same geometry as walking, including open passages and world bounds. */
  public check(
    spec: Extract<AbilityRestrictionSpec, { kind: 'room-for-form' }>,
    casterId: string,
    state: GameState,
  ): AbilityRejectReason | null {
    const body = state.entities.get(casterId)?.findComponent(Transform);
    if (body === undefined) return 'restricted';
    const radius = (body.radius / body.sizeMultiplier) * spec.sizeMultiplier;
    return state.collisions?.canFit?.(body.position, radius) === false ? 'restricted' : null;
  }
}
