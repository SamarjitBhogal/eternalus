import type { EffectShape } from '../../content/abilities/AbilityDefinition.types';

/** A `hit` shape's spec: it has no fields. */
export type HitSpec = Extract<EffectShape, { readonly kind: 'hit' }>;
