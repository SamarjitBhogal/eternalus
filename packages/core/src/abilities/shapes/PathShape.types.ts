import type { EffectShape } from '../../content/abilities/AbilityDefinition.types';

/** A `path` shape's spec. */
export type PathSpec = Extract<EffectShape, { readonly kind: 'path' }>;
