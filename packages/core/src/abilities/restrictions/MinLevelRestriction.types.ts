import type { AbilityRestrictionSpec } from '../../content/abilities/AbilityDefinition.types';

/** A `min-level` restriction's spec. */
export type MinLevelSpec = Extract<AbilityRestrictionSpec, { readonly kind: 'min-level' }>;
