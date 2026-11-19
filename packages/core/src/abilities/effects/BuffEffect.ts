import type { BuffSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';

/** Applies an authored beneficial status through the shared status applier. */
export class BuffEffect implements AbilityEffect<BuffSpec> {
  public readonly kind = 'buff';

  /** Receives the status catalogue used by the match. */
  public constructor(private readonly statuses: { has(id: string): boolean }) {}

  /** Rejects references to unknown statuses at content load. */
  public validate(spec: BuffSpec): readonly string[] {
    return this.statuses.has(spec.statusId) ? [] : [`Unknown buff status: ${spec.statusId}`];
  }

  /** A self buff has no ground targeting shape. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }

  /** Applies the status to the caster, preserving stacking and status events. */
  public apply(spec: BuffSpec, cast: CastContext): void {
    cast.statuses.apply(cast.state, cast.casterId, spec.statusId, cast.casterId);
  }
}
