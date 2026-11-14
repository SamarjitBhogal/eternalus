import type { AbilityRejectReason } from '../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';

/** The part of a restriction spec the registry reads: its kind, the key of its `AbilityRestriction`. */
export type RestrictionSpec = { readonly kind: string };

/**
 * One kind of cast precondition (05 §5): a stateless predicate over the caster and the state. A
 * new rule is one class and one `defaultAbilityRegistry.ts` line; a new use is a content line.
 */
export interface AbilityRestriction<S extends RestrictionSpec = RestrictionSpec> {
  /** The registry key, e.g. `min-level`. */
  readonly kind: S['kind'];
  /** Why `casterId` may not cast under `spec` now, or `null` when it may. */
  check(spec: S, casterId: EntityId, state: GameState): AbilityRejectReason | null;
}
