import type { Aim } from '../../components/AbilitySlotRuntime.types';
import type { AbilityRejectReason } from '../../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';

/** An ability's targeting (05 §2 `AbilityTargeting`) as the registry sees it: its kind is the key. */
export type TargetingSpec = { readonly kind: string };

/**
 * One kind of cast targeting (05 §2): whether the aim a cast is sent with will do, and the aim the
 * cast then runs with. Stateless; one instance per kind in the `AbilityRegistry`. `CastValidator`
 * and `AbilitySystem` ask it and never branch on the kind (rule 12). A new targeting kind is one
 * class and one `defaultAbilityRegistry.ts` line.
 */
export interface CastTargeting<S extends TargetingSpec = TargetingSpec> {
  /** The registry key, e.g. `directional`. */
  readonly kind: S['kind'];
  /**
   * Whether the cast reads the aim the player gives it: `false` when the cast aims itself (the
   * heading-aimed dash), so the client casts at once and needs no pointer (05 §7).
   */
  readonly usesAim: boolean;
  /** Why `aim` will not do for a cast of `casterId` now (`no-target`), or `null` when it will. */
  aimBlockedBy(spec: S, aim: Aim, casterId: EntityId, state: GameState): AbilityRejectReason | null;
  /** The aim a cast of `casterId` sent with `aim` runs with, read at the moment it runs. */
  aimFor(spec: S, aim: Aim, casterId: EntityId, state: GameState): Aim;
}
