import type { AbilityEffectSpec } from '../content/abilities/abilities.types';
import type { AbilityEffectContext } from './AbilityEffect.types';

/** One stateless behaviour, selected by the effect's content key. */
export interface AbilityEffect<K extends AbilityEffectSpec['kind']> {
  /** Applies one validated spell effect through the shared simulation services. */
  apply(spec: Extract<AbilityEffectSpec, { kind: K }>, context: AbilityEffectContext): void;
}
