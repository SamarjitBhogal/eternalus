import type { AbilityEffect } from './AbilityEffect';
import type { AbilityEffectContext } from './AbilityEffect.types';
import type { AbilityEffectSpec } from '../content/abilities/abilities.types';

/** Applies a content-defined self buff using the shared status facade. */
export class BuffEffect implements AbilityEffect<'buff'> {
  /** Effects and expiry come from the status definition. */
  public apply(
    spec: Extract<AbilityEffectSpec, { kind: 'buff' }>,
    { state, caster, statuses }: AbilityEffectContext,
  ): void {
    statuses.apply(state, caster.id, spec.statusId, caster.id);
  }
}
