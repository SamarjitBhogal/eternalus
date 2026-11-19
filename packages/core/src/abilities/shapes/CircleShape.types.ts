import type { EffectShape } from '../../content/abilities/AbilityDefinition.types';

/** A `circle` shape's spec. */
export type CircleSpec = Extract<EffectShape, { readonly kind: 'circle' }>;
