import type { EffectShape } from '../../content/abilities/AbilityDefinition.types';

/** A `cone` shape's spec. */
export type ConeSpec = Extract<EffectShape, { readonly kind: 'cone' }>;
