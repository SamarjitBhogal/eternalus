import { Progression } from '../../components/Progression';
import type {
  AbilityRejectReason,
  AbilityRestrictionSpec,
} from '../../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { AbilityRestriction } from '../AbilityRestriction.types';

/** A `min-level` restriction's spec. */
type MinLevelSpec = Extract<AbilityRestrictionSpec, { readonly kind: 'min-level' }>;

/** `min-level` (05 §5): the caster must be at least `level`; one without `Progression` is level 1. */
export class MinLevelRestriction implements AbilityRestriction<MinLevelSpec> {
  public readonly kind = 'min-level';

  /** `restricted` while the caster is below `spec.level`. */
  public check(
    spec: MinLevelSpec,
    casterId: EntityId,
    state: GameState,
  ): AbilityRejectReason | null {
    const level = state.entities.get(casterId)?.findComponent(Progression)?.level ?? 1;
    return level < spec.level ? 'restricted' : null;
  }
}
