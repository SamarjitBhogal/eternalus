import type { StatModifier } from '../content/status-effects/statusEffects.types';

/** A health-scaled modifier (`StatModifier.byLostHealth`) of an active status, with its stacks. */
export type ScaledModifier = Required<StatModifier> & { readonly stacks: number };
